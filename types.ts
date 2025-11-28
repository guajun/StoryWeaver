import * as d3 from 'd3';

export interface DialogueChoice {
  text: string;
  nextId: string;
  condition?: string;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  choices?: DialogueChoice[];
  // Optional metadata for visualization or logic
  position?: { x: number; y: number };
  tags?: string[];
}

export type DialogueTree = DialogueNode[];

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  speaker: string;
  text: string;
  type: 'node';
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
  bidirectional?: boolean;
}