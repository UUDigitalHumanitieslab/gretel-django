import { Component, OnInit, ViewChild } from '@angular/core';
import { Crumb } from "../../components/breadcrumb-bar/breadcrumb-bar.component";
import { MatrixSettings } from '../../components/step/matrix/matrix.component';
import { GlobalStateExampleBased, XpathInputStep, SentenceInputStep, ParseStep, SelectTreebankStep, ResultStep, MatrixStep, TreebankSelection } from "../multi-step-page/steps";
import { DecreaseTransition, IncreaseTransition, Transitions } from "../multi-step-page/transitions";
import { MultiStepPageComponent } from "../multi-step-page/multi-step-page.component";
import { AlpinoService } from '../../services/_index';

@Component({
    selector: 'grt-example-based-search',
    templateUrl: './example-based-search.component.html',
    styleUrls: ['./example-based-search.component.scss']
})
export class ExampleBasedSearchComponent extends MultiStepPageComponent<GlobalStateExampleBased> {
    sentenceInputStep: SentenceInputStep<GlobalStateExampleBased>;
    matrixStep: MatrixStep;

    @ViewChild('sentenceInput')
    sentenceInputComponent;
    @ViewChild('parse')
    parseComponent;

    constructor(private alpinoService: AlpinoService) {
        super();
    }

    initializeCrumbs() {
        this.crumbs = [
            {
                name: "Example",
                number: 0,
            },
            {
                name: "Parse",
                number: 1,
            },
            {
                name: "Matrix",
                number: 2,
            },
            {
                name: "Treebanks",
                number: 3,
            },
            {
                name: "Query",
                number: 4,
            },
            {
                name: "Results",
                number: 5,
            },
            {
                name: "Analysis",
                number: 6,
            },
        ];
    }

    initializeComponents() {
        this.components = [
            this.sentenceInputComponent,
            this.parseComponent
        ]
    }

    initializeGlobalState() {
        this.sentenceInputStep = new SentenceInputStep(0);
        this.matrixStep = new MatrixStep(2, this.alpinoService);
        this.globalState = {
            exampleXml: undefined,
            subTreeXml: undefined,
            selectedTreebanks: undefined,
            currentStep: this.sentenceInputStep,
            valid: true,
            xpath: '',
            loading: false,
            inputSentence: 'Dit is een voorbeeldzin.',
            isCustomXPath: false,
            attributes: [],
            tokens: []
        };
    }

    initializeConfiguration() {
        this.configuration = {
            steps: [
                this.sentenceInputStep,
                new ParseStep(1, this.alpinoService),
                this.matrixStep,
                new SelectTreebankStep(3),
                new ResultStep(4),
            ]
        };
    }

    initializeTransitions() {
        this.transitions = new Transitions([new IncreaseTransition(this.configuration.steps), new DecreaseTransition(this.configuration.steps)]);
    }

    /**
     * Updates the selected treebanks with the given selection
     * @param selectedTreebanks the new treebank selection
     */
    updateSelected(selectedTreebanks: TreebankSelection) {
        this.globalState.selectedTreebanks = selectedTreebanks;
    }

    updateSentence(sentence: string) {
        this.globalState.inputSentence = sentence;
        this.globalState.exampleXml = undefined; // reset parse
    }
    updateMatrix(matrixSettings: MatrixSettings) {
        if (matrixSettings.customXPath) {
            this.globalState.isCustomXPath = true;
            this.globalState.xpath = matrixSettings.customXPath;
        } else {
            this.globalState.isCustomXPath = false;
            this.globalState.tokens = matrixSettings.tokens;
            this.globalState.attributes = matrixSettings.attributes;
            this.matrixStep.updateMatrix(this.globalState);
        }
    }
}
