import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

type TreebankSelectionMap = {
    [provider: string]:
    {
        [corpus: string]: string[]
    }
};
/**
 * Rewrites GrETEL 4 address to GrETEL 5
 */
@Component({
    selector: 'grt-legacy-component',
    template: '<span>Rewriting address...</span>'
})
export class LegacyComponent {

    constructor(activatedRoute: ActivatedRoute, router: Router) {
        const segments = activatedRoute.snapshot.url;

        const queryParams = {
            ...activatedRoute.snapshot.queryParams
        };

        if (queryParams['selectedTreebanks']) {
            const selectedTreebanks = JSON.parse(queryParams.selectedTreebanks);
            queryParams['selectedTreebanks'] = JSON.stringify(this.rewriteComponentNames(selectedTreebanks));
        }

        if (segments.length >= 1 && segments[0].path === 'ng') {
            router.navigate(segments.slice(1).map(segment => segment.path), {
                queryParams
            });
        }
    }

    private rewriteComponentNames(selection: TreebankSelectionMap) {
        const rules: {
            [path: string]: {
                corpusName: (name: string) => string,
                componentName: (name: string) => string
            }
        } = {
            'gretel/cgn': {
                corpusName: () => 'cgn',
                componentName: (name) => name.replace('CGN_ID_', 'cgn-').toLowerCase()
            },
            'gretel/lassy': {
                corpusName: () => 'lassy-klein',
                componentName: (name) => name.replace('LASSY_ID_', 'cgn-').toLowerCase()
            },
            'gretel/*': {
                corpusName: (name) => 'GRETEL-UPLOAD-' + name,
                componentName: (name) => 'GRETEL-UPLOAD-' + name
            }
        };

        const output: TreebankSelectionMap = {};

        for (const [path, { corpusName, componentName }] of Object.entries(rules)) {
            const [matchProvider, matchCorpus] = path.split('/');
            const corpora = selection[matchProvider];
            if (corpora) {
                for (const [corpus, components] of Object.entries(corpora)) {
                    if (corpus === matchCorpus ||
                        (matchCorpus === '*' &&
                            (!output[matchProvider] ||
                                !(corpusName(corpus) in output[matchProvider])))
                    ) {
                        if (!output[matchProvider]) {
                            output[matchProvider] = {}
                        }
                        output[matchProvider][corpusName(corpus)] = components.map(componentName);
                    }
                }
            }
        }

        return output;
    }
}
