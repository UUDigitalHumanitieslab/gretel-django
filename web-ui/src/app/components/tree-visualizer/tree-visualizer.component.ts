import {
    AfterViewChecked,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnInit,
    OnChanges,
    Output,
    SecurityContext,
    SimpleChange,
    ViewChild,
} from '@angular/core';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { faArrowsAlt, faChevronLeft, faChevronRight, faCommentDots, faFileCode, faTimes, faSearchMinus, faSearchPlus } from '@fortawesome/free-solid-svg-icons';

import * as $ from 'jquery';

import { animations } from '../../animations';
import { DownloadService, ParseService } from '../../services/_index';
import './tree-visualizer';

type TypedChanges = { [name in keyof TreeVisualizerComponent]: SimpleChange };
export type TreeVisualizerDisplay = 'fullscreen' | 'inline' | 'both';
interface Metadata {
    name: string;
    /**
     * This can contain xml entities, display using innerHTML
     */
    value: string;
}

@Component({
    animations,
    selector: 'grt-tree-visualizer',
    templateUrl: './tree-visualizer.component.html',
    styleUrls: ['./tree-visualizer.component.scss']
})
export class TreeVisualizerComponent implements OnChanges, OnInit, AfterViewChecked {
    faArrowsAlt = faArrowsAlt;
    faChevronLeft = faChevronLeft;
    faChevronRight = faChevronRight;
    faCommentDots = faCommentDots;
    faFileCode = faFileCode;
    faTimes = faTimes;
    faSearchMinus = faSearchMinus;
    faSearchPlus = faSearchPlus;

    @ViewChild('output', { static: true, read: ElementRef })
    public output: ElementRef;
    @ViewChild('inline', { read: ElementRef })
    public inlineRef: ElementRef;
    @ViewChild('tree', { read: ElementRef })
    public tree: ElementRef;
    @ViewChild('metadataCard', { read: ElementRef })
    public metadataCard: ElementRef;

    @Input()
    public xml: string;

    @Input()
    public sentence: SafeHtml;

    @Input()
    public filename: string;

    @Input()
    public display: TreeVisualizerDisplay = 'inline';

    @Input()
    public fullScreenButton = true;

    @Input()
    public showMatrixDetails: boolean;

    @Input()
    public url: string;

    @Input()
    public loading = false;

    @Input()
    public selectedNodes: { [name: string]: boolean } = {};

    @Output()
    public displayChange = new EventEmitter<TreeVisualizerDisplay>();

    @Output()
    public nodeClick = new EventEmitter<string>();

    public metadata: Metadata[] | undefined;
    public showLoader: boolean;

    // jquery tree visualizer
    private instance: any;

    constructor(private sanitizer: DomSanitizer, private downloadService: DownloadService, private parseService: ParseService) {
    }

    ngOnInit() {
        const element = $(this.output.nativeElement);
        element.on('close', () => {
            if (this.display === 'both') {
                this.displayChange.next('inline');
            }
        });
    }

    ngOnChanges(changes: TypedChanges) {
        const element = $(this.output.nativeElement);
        if (changes.loading && this.loading) {
            this.showLoader = true;
        }

        if (changes.selectedNodes && this.instance) {
            const selectedNodes = Object.entries(this.selectedNodes)
                .filter(([_, selected]) => selected)
                .map(([node, _]) => node);
            this.instance.trigger('select-nodes', [selectedNodes]);
        }

        if (!this.loading && this.xml) {
            if (changes.xml && changes.xml.currentValue !== changes.xml.previousValue) {
                this.visualize(element);
            }

            if (this.instance) {
                this.updateVisibility();
            }
        }
    }

    ngAfterViewChecked() {
        if (this.tree && this.metadataCard) {
            // make sure the metadata overview doesn't overflow
            $(this.metadataCard.nativeElement).css({
                maxHeight: $(this.tree.nativeElement).outerHeight()
            });
        }
    }

    downloadXml() {
        this.downloadService.downloadXml(
            this.filename || 'tree.xml',
            this.xml);
    }

    private visualize(element: any) {
        setTimeout(() => {
            // Make sure the visualization happens after the
            // view (which acts a placeholder) has been rendered.
            this.instance = element.treeVisualizer(this.xml, {
                nvFontSize: 14,
                sentence: (this.sentence && this.sanitizer.sanitize(SecurityContext.HTML, this.sentence)) || '',
                showMatrixDetails: this.showMatrixDetails
            });

            this.instance.on('node-selected', (event, data) => this.nodeSelected(event, data));

            this.parseService.parseXml(this.xml).then((data) => {
                this.showMetadata(data);
            });
            this.updateVisibility();
        });
    }

    private nodeSelected(event: JQuery.Event, data: { varname: string }) {
        this.nodeClick.emit(data.varname);
    }

    private updateVisibility() {
        const inline = $(this.inlineRef && this.inlineRef.nativeElement);

        if (this.display !== 'fullscreen') {
            inline.show();
        } else {
            inline.hide();
        }

        if (this.display !== 'inline') {
            this.instance.trigger('open-fullscreen');
        } else {
            this.instance.trigger('close-fullscreen');
        }

        this.showLoader = false;
    }

    /**
     * Shows the metadata of a tree.
     * @param data The parsed XML data
     */
    private showMetadata(data: {
        alpino_ds: {
            metadata: {
                meta: {
                    $: {
                        name: string,
                        value: string
                    }
                }[]
            }[]
        }[]
    }) {
        const result: Metadata[] = [];
        if (data && data.alpino_ds && data.alpino_ds.length === 1 && data.alpino_ds[0].metadata
            && data.alpino_ds[0].metadata[0].meta) {
            for (const item of data.alpino_ds[0].metadata[0].meta.sort(function (a: any, b: any) {
                return a.$.name.localeCompare(b.$.name);
            })) {
                result.push({ name: item.$.name, value: item.$.value });
            }
        }
        this.metadata = result.length ? result : undefined;
    }
}
