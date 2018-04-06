import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { Observable } from "rxjs/Observable";

import { XmlParseService } from './xml-parse.service';

@Injectable()
export class ResultsService {
    constructor(private http: HttpClient, private sanitizer: DomSanitizer, private xmlParseService: XmlParseService) {
    }

    async results(xpath: string,
        corpus: string,
        components: string[],
        offset: number = 0,
        retrieveContext: boolean,
        isAnalysis = false,
        variables: { name: string, path: string }[] = null) {
        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
            })
        };
        const url = '/gretel/api/src/router.php/results';
        let results = await this.http.post<ApiSearchResult | false>(url, {
            xpath,
            retrieveContext,
            corpus,
            components,
            offset,
            isAnalysis,
            variables
        }, httpOptions).toPromise();
        if (results) {
            return this.mapResults(results);
        }

        return false;
    }

    private async mapResults(results: ApiSearchResult): Promise<SearchResults> {
        return {
            hits: await this.mapHits(results),
            lastOffset: results[7]
        }
    }

    private mapHits(results: ApiSearchResult): Promise<Hit[]> {
        return Promise.all(Object.keys(results[0]).map(async hitId => {
            let sentence = results[0][hitId];
            let nodeStarts = results[3][hitId].split('-').map(x => parseInt(x));
            let metaValues = this.mapMeta(await this.xmlParseService.parse(`<metadata>${results[5][hitId]}</metadata>`));
            let variableValues = this.mapVariables(await this.xmlParseService.parse(results[6][hitId]));
            return {
                fileId: hitId.replace(/-endPos=(\d+|all)\+match=\d+$/, ''),
                sentence,
                highlightedSentence: this.highlightSentence(sentence, nodeStarts, 'strong'),
                treeXml: results[4][hitId],
                nodeIds: results[2][hitId].split('-').map(x => parseInt(x)),
                nodeStarts,
                metaValues,
                /**
                 * Contains the XML of the node matching the variable
                 */
                variableValues
            };
        }));
    }

    private mapMeta(data: {
        metadata: {
            meta: {
                $: {
                    type: string,
                    name: string,
                    value: string
                }
            }[]
        }
    }): Hit['metaValues'] {
        return data.metadata.meta.reduce((values, meta) => {
            values[meta.$.name] = meta.$.value;
            return values;
        }, {});
    }

    private mapVariables(data: {
        vars: {
            var: {
                $: {
                    name: string,
                    pos?: string,
                    lemma?: string
                }
            }[]
        }
    }): Hit['variableNodes'] {
        return data.vars.var.reduce((values, variable) => {
            values[variable.$.name] = {
                pos: variable.$.pos,
                lemma: variable.$.lemma
            };
            return values;
        }, {});
    }

    private highlightSentence(sentence: string, nodeStarts: number[], tag: string) {
        // translated from treebank-search.php
        let prev: string, next: string;

        if (sentence.indexOf('<em>') >= 0) {
            // Showing the context of this hit
            let $groups = /(.*<em>)(.*?)(<\/em>.*)/.exec(sentence);
            sentence = $groups[2];
            prev = $groups[1];
            next = $groups[3];
        }

        let words = sentence.split(' ');

        // Instead of wrapping each individual word in a tag, merge sequences
        // of words in one <tag>...</tag>
        for (let i = 0; i < words.length; i++) {
            let word = words[i];
            if (nodeStarts.indexOf(i) >= 0) {
                let value = '';
                if (nodeStarts.indexOf(i - 1) == -1) {
                    value += `<${tag}>`;
                }
                value += words[i];
                if (nodeStarts.indexOf(i + 1) == -1) {
                    value += `</${tag}>`;
                }
                words[i] = value;
            }
        }
        let highlightedSentence = words.join(' ');
        if (prev || next) {
            highlightedSentence = prev + ' ' + highlightedSentence + ' ' + next;
        }

        return this.sanitizer.bypassSecurityTrustHtml(highlightedSentence);
    }
}

type ApiSearchResult = [
    // 0 sentences
    { [id: string]: string },
    // 1 tblist (used for Sonar)
    false,
    // 2 ids
    { [id: string]: string },
    // 3 begin positions
    { [id: string]: string },
    // 4 xml
    { [id: string]: string },
    // 5 meta list
    { [id: string]: string },
    // 6 variable list
    { [id: string]: string },
    // 7 end pos iteration
    number
];

export interface SearchResults {
    hits: Hit[],
    /**
     * Start offset for retrieving the next results
     */
    lastOffset: number
}

export interface Hit {
    fileId: string,
    sentence: string,
    highlightedSentence: SafeHtml,
    treeXml: string,
    /**
     * The ids of the matching nodes
     */
    nodeIds: number[],
    /**
     * The begin position of the matching nodes
     */
    nodeStarts: number[],
    metaValues: { [key: string]: string },
    /**
     * Contains the properties of the node matching the variable
     */
    variableValues: { [variableName: string]: { [propertyKey: string]: string } },
};
