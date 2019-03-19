///<reference path="pivottable.d.ts"/>
///<reference types="jqueryui"/>
import { Component, Input, OnDestroy, OnInit, NgZone, Output, EventEmitter } from '@angular/core';
import { BehaviorSubject, Subject, Subscription, combineLatest, merge } from 'rxjs';
import { map, take, tap, switchMap } from 'rxjs/operators';

import * as $ from 'jquery';
import 'jquery-ui/ui/widgets/draggable';
import 'jquery-ui/ui/widgets/sortable';
import 'pivottable';

import { ExtractinatorService, PathVariable, ReconstructorService } from 'lassy-xpath/ng';

import { AnalysisService, ResultsService, TreebankService, Hit, mapTreebanksToSelectionSettings, mapToTreebankArray, FilterValues, FilterByXPath, FilterValue } from '../../services/_index';
import { FileExportRenderer } from './file-export-renderer';
import { TreebankMetadata } from '../../treebank';

// TODO selected treebanks need to be reactive?
// TODO use something other than the first results

@Component({
    selector: 'grt-analysis',
    templateUrl: './analysis.component.html',
    styleUrls: ['./analysis.component.scss']
})
export class AnalysisComponent implements OnInit, OnDestroy {
    left: number;
    top: number;
    private $element: JQuery<HTMLElement>;
    private pivotUiOptions: PivotUiOptions;
    private metadata: TreebankMetadata[] = [];
    private hits: Hit[] = [];

    private selectedVariablesSubject = new BehaviorSubject<SelectedVariable[]>([]);

    public variables: { [name: string]: PathVariable; };
    public treeXml: string;
    public treeDisplay = 'inline';

    public isLoading = true;
    public selectedVariable?: SelectedVariable;

    @Input()
    public xpath: string;

    @Output()
    public filterResults = new EventEmitter<{
        xpath: string,
        filterValues: FilterValues
    }>();

    public attributes: { value: string, label: string }[];

    private subscriptions: Subscription[] = [];
    private cancellationToken = new Subject<{}>();

    constructor(
        private analysisService: AnalysisService,
        private extractinatorService: ExtractinatorService,
        private reconstructorService: ReconstructorService,
        private resultsService: ResultsService,
        private treebankService: TreebankService,
        private ngZone: NgZone
    ) {
    }

    ngOnInit() {
        this.$element = $('.analysis-component');
        this.initialize();
    }

    ngOnDestroy() {
        for (const subscription of this.subscriptions) {
            subscription.unsubscribe();
        }
        this.cancellationToken.next();
    }

    private async initialize() {

        let variables: PathVariable[];
        try {
            variables = this.extractinatorService.extract(this.xpath);
        } catch (e) {
            variables = [];
            console.warn('Error extracting variables from path', e, this.xpath);
        }

        // TODO: on change
        this.variables = variables.reduce<{[name: string]: PathVariable}>((vs, v) => { vs[v.name] = v; return vs; }, {})
        this.treeXml = this.reconstructorService.construct(variables, this.xpath);

        // Show a default pivot using the first node variable's lemma property against the POS property.
        // This way the user will get to see some useable values to help clarify the interface.
        if (variables.length > 0) {
            let firstVariable = variables[variables.length > 1 ? 1 : 0];
            this.selectedVariablesSubject.next([{
                attribute: 'pt',
                axis: 'row',
                variable: firstVariable
            }, {
                attribute: 'lemma',
                axis: 'col',
                variable: firstVariable
            }]);

            let utils = $.pivotUtilities;
            let heatmap = utils.renderers["Heatmap"];
            let renderers = $.extend($.pivotUtilities.renderers,
                { 'File export': (new FileExportRenderer()).render });

            this.pivotUiOptions = {
                aggregators: {
                    'Count': utils.aggregators['Count'],
                    'Count Unique Values': utils.aggregators['Count Unique Values'],
                    'Count as Fraction of Columns': utils.aggregators['Count as Fraction of Columns'],
                    'Count as Fraction of Total': utils.aggregators['Count as Fraction of Total'],
                    'First': utils.aggregators['First'],
                    'Last': utils.aggregators['Last']
                },
                rows: [firstVariable.name + '.pt'],
                cols: [firstVariable.name + '.lemma'],
                renderer: heatmap,
                renderers,
                onRefresh: (data) => {
                    this.pivotUiOptions = data;
                    this.addTableClickEvent();
                }
            };
        } else {
            this.selectedVariablesSubject.next([]);
        }

        const subscriptionToTreebankSelection = this.treebankService.treebanks.pipe(
            map(v => ({
                selected: mapTreebanksToSelectionSettings(v.state),
                state: v.state
            })),
            switchMap(v => {
                this.hits = [];
                this.metadata = v.selected.flatMap(s => v.state[s.provider][s.corpus].metadata);
                // fetch all results for all selected components/treebanks
                // and merge them into a single stream that's subscribed to.
                return merge(...v.selected.map(selection => this.resultsService.getAllResults(
                    this.xpath,
                    selection.provider,
                    selection.corpus,
                    selection.components.map(c => c.server_id),
                    false,
                    true,
                    [],
                    variables
                )));
            })
        )
        .subscribe(v => {
            this.hits.push(...v.hits);
        })

        this.subscriptions = [
            this.livePivot(),
            subscriptionToTreebankSelection
        ];
    }

    private makeDraggable() {
        $('.path-variable,.tree-visualizer li[data-varname]').draggable({
            appendTo: 'body',
            connectToSortable: '.pvtHorizList,.pvtRows',
            stop: (event, ui) => {
                if ($('.pvtHorizList').find(ui.helper).length) {
                    this.showVariableToAdd(ui.helper, 'col');
                }
                if ($('.pvtRows').find(ui.helper).length) {
                    this.showVariableToAdd(ui.helper, 'row');
                }
            },
            helper: (event: Event) => {
                const data = $(event.currentTarget).data();
                const variable = data['variable'] || data['varname'];
                return $(`<li class="tag">${variable}</li>`).css('cursor', 'move');
            },
            revert: true
        });
    }

    public cancelVariable() {
        this.selectedVariable = undefined;
    }

    public async addVariable() {
        this.pivotUiOptions[this.selectedVariable.axis === 'row' ? 'rows' : 'cols']
            .push(`${this.selectedVariable.variable.name}.${this.selectedVariable.attribute}`);
        this.selectedVariablesSubject.next(this.selectedVariablesSubject.value.concat([this.selectedVariable]));
        this.selectedVariable = undefined;
    }

    private livePivot() {
        return this.selectedVariablesSubject.pipe(map((selectedVariables) => {
            this.show(this.$element, selectedVariables);
        })).subscribe();
    }

    private showVariableToAdd(helper: JQuery<HTMLElement>, axis: 'row' | 'col') {
        const variableName = helper.text().trim();
        const offset = $('.pvtRendererArea').offset();
        this.top = offset.top;
        this.left = offset.left;

        helper.remove();

        // only work with available attributes
        const attributes = this.analysisService.getVariableAttributes(variableName, this.hits);

        this.ngZone.run(() => {
            // show the window to add a new variable for analysis
            this.attributes = attributes;
            const values = attributes.map(x => x.value);
            this.selectedVariable = {
                attribute: values.find(v => v === 'pt') || values.find(v => v === 'cat') || values[0],
                axis,
                variable: this.variables[variableName]
            };
        });
    }

    private async show(element: JQuery<HTMLElement>, selectedVariables: SelectedVariable[]) {
        this.isLoading = true;
        try {
            this.pivot(element, this.metadata.map(m => m.field), this.hits, selectedVariables);
        } catch (error) {
            // TODO: improved error notification
            console.error(error);
        }

        this.makeDraggable();

        this.isLoading = false;
    }

    private pivot(element: JQuery, metadataKeys: string[], hits: Hit[], selectedVariables: SelectedVariable[]) {
        const variables = selectedVariables.reduce((grouped, s) => {
            grouped[s.variable.name]
                ? grouped[s.variable.name].push(s.attribute)
                : grouped[s.variable.name] = [s.attribute];
            return grouped;
        }, {} as {[variableName: string]: string[]});
        const pivotData = this.analysisService.getFlatTable(
            hits,
            variables,
            metadataKeys);
        element.empty();
        const table = $('<div>');
        element.append(table);
        table.pivotUI(pivotData, this.pivotUiOptions);
        $('.pvtUi').addClass('table is-bordered');
    }


    private getRowFilters(element: HTMLElement) {
        const rows = this.getRowElements(element);
        return this.getValueFromFilters(rows, this.getRowIndex(element), 'rowSpan');
    }

    private getColumnFilters(element: HTMLElement) {
        const columns = this.getColumnElements(element);
        return this.getValueFromFilters(columns, this.getColumnIndex(element), 'colSpan');
    }

    /**
     * Returns the value of the given filters, based on the given index and the span name from which we must get the span width
     * @param elementGroups
     * @param index
     * @param spanName
     * @returns {{}}
     */
    private getValueFromFilters(elementGroups: { [name: string]: Element[] }, index: number, spanName: 'colSpan'|'rowSpan') {
        const results: FilterValues = {};
        for (const id of Object.keys(elementGroups)) {
            const elements = elementGroups[id],
                spans = elements.map(v => ({
                    value: v.innerHTML,
                    size: (v as HTMLTableCellElement)[spanName]
                }));
            let value = '',
                total = 0;
            for (const span of spans) {
                total += span.size;
                if (index < total) {
                    value = span.value;
                    break;
                }
            }
            results[id] = id[0] !== '$'
                ? this.getFilterValue(id, value)
                : this.getFilterForQuery(id, value);
        }
        return results;
    }

    /**
     * Gets filters for an extracted xpath query
     * @param id The variable name representing part of the query and the attribute name
     * @param value The attribute value
     */
    private getFilterForQuery(id: string, value: string): FilterByXPath {
        const [variable, attribute] = id.split('.');
        return this.resultsService.getFilterForQuery(
            variable,
            attribute,
            value === AnalysisService.placeholder
                ? null
                : value, this.variables);
    }

    private getFilterValue(field: string, value: string): FilterValue {
        const metadata = this.metadata.find(f => f.field === field)!;
        switch (metadata.facet) {
            case 'checkbox':
            case 'dropdown':
                return {
                    dataType: 'text',
                    type: 'multiple',
                    values: [value],
                    field
                };
            case 'range':
            case 'slider':
                switch (metadata.type) {
                    case 'date':
                        return {
                            dataType: 'date',
                            type: 'range',
                            min: value,
                            max: value,
                            field,
                        };
                    case 'int':
                        return {
                            dataType: 'int',
                            type: 'range',
                            min: parseInt(value, 10),
                            max: parseInt(value, 10),
                            field,
                        };
                }
        }
    }


    private getColumnIndex(element: HTMLElement) {
        return this.getNumberFromClass(element, 'col');

    }

    private getRowIndex(element: HTMLElement) {
        return this.getNumberFromClass(element, 'row');
    }

    private getNumberFromClass(element: HTMLElement, className: string): number {
        const name = Array.from(element.classList).filter((cName: string) => cName.includes(className))[0];
        return parseInt(name.replace(className, ''), 10);
    }

    /**
     * Gets the columns by name containing the head elements
     *
     * @param element
     * @returns {string: HTMLElement[]}
     */
    private getColumnElements(element: HTMLElement) {
        const columns: { [name: string]: Element[] } = {},
            topRows = element.parentElement.parentElement.parentElement.childNodes[0],
            // Only use the last row.
            rows = Array.from(topRows.childNodes).slice(0, topRows.childNodes.length - 1);
        for (const child of rows) {
            const newChild = child as HTMLElement, // To make sure there is no compile error
                name = this.getElementByClass(newChild.children, 'pvtAxisLabel')[0].innerHTML,
                children = this.getElementByClass(newChild.children, 'pvtColLabel');
            columns[name] = children;

        }
        return columns;
    }

    private getRowElements(element: HTMLElement) {
        const rows = {};
        // First get the titles
        const head = element.parentElement.parentElement.parentElement.childNodes[0];
        const body = element.parentElement.parentElement.parentElement.childNodes[1];
        // Only use the last row
        const headRows = Array.from(head.childNodes)[head.childNodes.length - 1];
        const bodyRows = Array.from(body.childNodes).slice(0, body.childNodes.length - 1);
        const titles = Array.from(headRows.childNodes).slice(0, headRows.childNodes.length - 1).map((e: HTMLElement) => e.innerHTML);
        const filters: {[title: string]: Element[]} = {};
        for (const title of titles) {
            filters[title] = [];
        }
        for (const row of bodyRows) {
            const tempRow = row as HTMLTableRowElement,
                childElements = this.getElementByClass(tempRow.children, 'pvtRowLabel');

            let index = titles.length;
            for (let i = childElements.length - 1; i >= 0; i--) {
                const child = childElements[i],
                    title = titles[--index];
                filters[title].push(child);
            }
        }
        return filters;
    }

    private addTableClickEvent() {
        $('.pvtVal').off('click');
        $('.pvtVal').on('click', ($event) => {
            this.ngZone.run(() => {
                const element = $event.currentTarget;
                const filterValues = {
                    ...this.getRowFilters(element),
                    ...this.getColumnFilters(element)
                };

                this.filterResults.next({
                    xpath: this.xpath,
                    filterValues
                });
            });
        });
    }

    private getElementByClass(htmlCollection: HTMLCollection, className: string) {
        const result: Element[] = [];
        for (let i = 0; i < htmlCollection.length; i++) {
            if ($(htmlCollection[i]).hasClass(className)) {
                result.push(htmlCollection[i]);
            }
        }
        return result;
    }
}

interface SelectedVariable {
    attribute: string;
    variable: PathVariable;
    axis: 'row' | 'col';
}
