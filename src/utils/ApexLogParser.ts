import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { extractTimestamp, extractLineNumber, extractObject, extractRows } from './apexLogExtractors';

interface GovernorLimit {
  used: number;
  max: number;
}

interface GovernorLimits {
  [limitType: string]: GovernorLimit;
}

interface TreeNode {
  type: 'ROOT' | 'CODE UNIT' | 'METHOD' | 'SOQL' | 'DML' | 'EXCEPTION';
  name?: string;
  method?: string;
  lineNumber?: number;
  query?: string;
  object?: string;
  rows?: number;
  operation?: string;
  message?: string;
  timeStart?: number;
  timeEnd?: number;
  duration?: number;
  rowsReturned?: number;
  children?: TreeNode[];
}

interface ParsedLog {
  meta: {
    filename: string;
    durationMs: number;
  };
  user?: string;
  limits: GovernorLimits;
  tree: TreeNode | null;
}


class ApexLogParser {
  private limits: GovernorLimits = {};
  private user?: string;
  private meta: Record<string, string> = {};
  private startTime: number | null = null;
  private endTime: number | null = null;
  private currentNode!: TreeNode;
  private rootNode: TreeNode | null = null;
  private nodeStack: TreeNode[] = [];

  public constructor() {
    this.reset();
  }

  public async parseFile(filePath: string): Promise<ParsedLog> {
    if (!filePath) throw new Error('File path is required');
    if (!fs.existsSync(filePath)) throw new Error(`File ${filePath} does not exist`);

    this.reset();
    this.meta.filename = path.basename(filePath);

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      this.parseLine(line.trim());
    }

    return this.buildOutput();
  }

  private buildOutput(): ParsedLog {
    const output: ParsedLog = {
      meta: {
        filename: this.meta.filename,
        durationMs:
          this.endTime && this.startTime
            ? Math.round(((this.endTime - this.startTime) + Number.EPSILON) * 1000) / 1000
            : 0
      },
      user: this.user,
      limits: this.limits,
      tree: this.rootNode,
    };

    return output;
  }


  private reset(): void {
    this.limits = {};
    this.meta = {};
    this.startTime = null;
    this.endTime = null;
    const rootNode: TreeNode = {
      type: 'ROOT',
    };

    this.rootNode = rootNode;
    this.currentNode = rootNode;
    this.nodeStack = [rootNode];
    this.user = undefined;
  }

  private parseLine(line: string): void {
    const parts = line.split('|');
    if (parts.length < 3) return;

    const executionTimePart = parts[0];
    const timestamp = extractTimestamp(executionTimePart);
    const eventType = parts[1];
    const eventData: string[] = parts.slice(2);

    switch (eventType) {
      case 'USER_INFO':
        this.handleUserInfo(eventData);
        break;
      case 'CODE_UNIT_STARTED':
        this.handleCodeUnitStarted(timestamp, eventData);
        break;
      case 'CODE_UNIT_FINISHED':
        this.handleNodeExit(timestamp);
        break;
      case 'METHOD_ENTRY':
        this.handleMethodEntry(timestamp, eventData);
        break;
      case 'METHOD_EXIT':
        this.handleNodeExit(timestamp);
        break;
      case 'SOQL_EXECUTE_BEGIN':
        this.handleSoqlExecuteBegin(timestamp, eventData);
        break;
      case 'SOQL_EXECUTE_END':
        this.handleSOQLExit(timestamp, eventData);
        break;
      case 'DML_BEGIN':
        this.handleDmlBegin(timestamp, eventData);
        break;
      case 'DML_END':
        this.handleNodeExit(timestamp);
        break;
      default:
        break;
    }
  }

  private handleDmlBegin(timestamp: number, eventData: string[]): void {
    const node: TreeNode = {
      type: 'DML',
      timeStart: timestamp,
      // Predefine timeEnd and duration so they appear before children in JSON output
      timeEnd: undefined,
      duration: undefined,
      lineNumber: extractLineNumber(eventData[0]),
      operation: eventData[eventData.length - 3].split(':')[1],
      object: eventData[eventData.length - 2].split(':')[1],
      rows: extractRows(eventData[eventData.length - 1]),
    };
    this.pushNode(node);
  }

  private handleSOQLExit(timestamp: number, eventData: string[]): void {
    if (this.currentNode && this.currentNode.type === 'SOQL') {
      this.currentNode.rows = extractRows(eventData[eventData.length - 1]);
    }
    this.handleNodeExit(timestamp);
  }

  private handleSoqlExecuteBegin(timestamp: number, eventData: string[]): void {
    const query = eventData[eventData.length - 1];
    const object = extractObject(query);
    const node: TreeNode = {
      type: 'SOQL',
      timeStart: timestamp,
      // Predefine timeEnd and duration so they appear before children in JSON output
      timeEnd: undefined,
      duration: undefined,
      query,
      object,
      rows: undefined,
    };
    this.pushNode(node);
  }

  private handleUserInfo(eventData: string[]): void {
    this.user = eventData[eventData.length - 3];
  }


  private handleCodeUnitStarted(timestamp: number, eventData: string[]): void {
    const node: TreeNode = {
      type: 'CODE UNIT',
      timeStart: timestamp,
      // Predefine timeEnd and duration so they appear before children in JSON output
      timeEnd: undefined,
      duration: undefined,
      name: eventData[eventData.length - 1],
    };
    this.pushNode(node);
  }

  private handleMethodEntry(timestamp: number, eventData: string[]): void {
    const node: TreeNode = {
      type: 'METHOD',
      timeStart: timestamp,
      lineNumber: extractLineNumber(eventData[0]),
      timeEnd: undefined,
      duration: undefined,
      method: eventData[eventData.length - 1],
    };
    this.pushNode(node);
  }

  private handleNodeExit(timestamp: number): void {
    if (this.nodeStack.length === 0) return;

    const node = this.nodeStack.pop()!;
    node.timeEnd = timestamp;
    const rawDuration = node.timeStart ? timestamp - node.timeStart : 0;
    // Round duration to 3 decimal places
    node.duration = Math.round((rawDuration + Number.EPSILON) * 1000) / 1000;

    this.currentNode = this.nodeStack[this.nodeStack.length - 1] ?? null;
  }

  private pushNode(node: TreeNode): void {
    if (!this.currentNode) return;

    this.currentNode.children = this.currentNode.children ?? [];
    this.currentNode.children.push(node);
    this.nodeStack.push(node);
    this.currentNode = node;
  }
}

export default ApexLogParser;
export { ApexLogParser, ParsedLog };
