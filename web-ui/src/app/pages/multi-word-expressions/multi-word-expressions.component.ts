import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { StateService, TreebankService, MweService } from '../../services/_index';
import { MweCanonicalForm } from '../../services/mwe.service';
import { MultiStepPageDirective } from '../multi-step-page/multi-step-page.directive';
import { NotificationService } from '../../services/notification.service';

import {
    GlobalState, SentenceInputStep, Step, SelectTreebankStep,
    ResultsStep, AnalysisStep
} from '../multi-step-page/steps';
import { TreebankSelection } from '../../treebank';

import { MweQuery, MweQuerySet } from '../../services/mwe.service';

interface MweState extends GlobalState {
    canonicalForm: {text: string, id?:number};
    querySet: MweQuerySet;
    currentQuery: MweQuery;
}

class MweResultsStep extends ResultsStep<MweState> {
    constructor(number: number, private mweService: MweService, private notificationService: NotificationService) {
        super(number);
    }

    async enterStep(state: MweState) {
        state.valid = false;

        try {
            state.querySet = await this.mweService.generateQuery(state.canonicalForm.text);
            let rank = state.currentQuery?.rank ?? 1;
            state.currentQuery = state.querySet[rank - 1];
            state.xpath = state.currentQuery.xpath;

            state.valid = true;
            state.currentStep = this;
        }
        catch(err) {
            this.notificationService.add('Could not generate queries for expression', 'error');
        }

        return state;
    }
}

@Component({
    selector: 'grt-multi-word-expressions',
    templateUrl: './multi-word-expressions.component.html',
    styleUrls: ['./multi-word-expressions.component.scss']
})
export class MultiWordExpressionsComponent extends MultiStepPageDirective<MweState> implements OnInit {
    protected defaultGlobalState: MweState = {
        connectionError: false,
        currentStep: undefined,
        filterValues: {},
        loading: false,
        retrieveContext: false,
        selectedTreebanks: new TreebankSelection(this.treebankService),
        valid: true,
        variableProperties: undefined,
        xpath: '',
        canonicalForm: null,
        querySet: undefined,
        currentQuery: null,
    };

    private mweService: MweService;
    steps: Step<MweState>[];
    canonicalForms: Promise<MweCanonicalForm[]>;

    constructor(treebankService: TreebankService, stateService: StateService<MweState>,
                mweService: MweService, route: ActivatedRoute, router: Router, private notificationService: NotificationService) {
        super(route, router, treebankService, stateService);
        this.mweService = mweService;

        this.canonicalForms = this.mweService.getCanonical();
    }

    initializeSteps(): { step: Step<MweState>, name: string }[] {
        return [{
            step: new SentenceInputStep(0),
            name: 'Canonical form'
        },
        {
            name: 'Treebanks',
            step: new SelectTreebankStep(1, this.treebankService)
        },
        {
            step: new MweResultsStep(2, this.mweService, this.notificationService),
            name: 'Results',
        },
        {
            step: new AnalysisStep(3),
            name: 'Analysis',
        }];
    }

    encodeGlobalState(state: MweState) {
        return Object.assign(super.encodeGlobalState(state), {
            'canonicalForm': JSON.stringify(state.canonicalForm),
            'currentQuery': JSON.stringify({rank:state.currentQuery.rank, description:state.currentQuery.description}),
            // clear the xpath expression in the URL to save space (see GH issue #47)
            'xpath': '',
        });
    }

    decodeGlobalState(queryParams: { [key: string]: any }) {
        return {
            selectedTreebanks: new TreebankSelection(
                this.treebankService,
                queryParams.selectedTreebanks ? JSON.parse(queryParams.selectedTreebanks) : undefined),
            canonicalForm: JSON.parse(queryParams.canonicalForm ?? '{}'),
            currentQuery: JSON.parse(queryParams.currentQuery ?? '{}'),
            valid: true
        };
    }

    async startWithExpression(canonicalForm: {text: string, id?: number}) {
        this.stateService.setState({canonicalForm});
        this.setValid(true);
        this.next();
    }

    proceedWithQuery(query: MweQuery) {
        this.stateService.setState({xpath: query.xpath, currentQuery: query});
        this.setValid(true);
        this.next();
    }

    async updateXPath(xpath: string) {
        this.stateService.setState({xpath});
    }

    changeQuery(query: MweQuery) {
        this.stateService.setState({currentQuery: query});
        this.updateXPath(query.xpath);
    }

    async saveQuery() {
        let query = this.globalState.currentQuery;
        let response = await this.mweService.saveCustomQuery({
            id: query.id,
            description: query.description,
            xpath: this.globalState.xpath,
            rank: query.rank,
            canonical: this.globalState.canonicalForm.id,
        });

        this.stateService.setState({currentQuery: response});
    }

    updateRetrieveContext(retrieveContext: boolean) {
        this.stateService.setState({ retrieveContext });
    }
}
