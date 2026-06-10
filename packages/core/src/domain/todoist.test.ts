import { describe, expect, it } from "vitest";
import {
  parseCsv,
  parseTodoistCsv,
  parseTodoistDate,
  priorityToFlags,
} from "./todoist.js";

const EXPORT = `TYPE,CONTENT,DESCRIPTION,PRIORITY,INDENT,AUTHOR,RESPONSIBLE,DATE,DATE_LANG,TIMEZONE
task,Buy groceries,,4,1,Geert (123),,2026-06-13,en,Europe/Brussels
note,"a comment on the task",,,,,,,,
task,"Reply to HOA, politely","Keep it short",3,1,Geert (123),,,en,
section,Errands,,,,,,,,
task,"Quote ""everything"" carefully",,1,1,Geert (123),,every day,en,
task,Plan the family trip,,2,1,Geert (123),,13 Jun,en,
`;

describe("parseCsv", () => {
  it("handles quoted fields, escaped quotes, and embedded commas", () => {
    const rows = parseCsv('a,"b,c","say ""hi"""\nd,e,f');
    expect(rows).toEqual([
      ["a", "b,c", 'say "hi"'],
      ["d", "e", "f"],
    ]);
  });
});

describe("parseTodoistCsv", () => {
  it("imports task rows only, with content, notes, priority, and date", () => {
    const tasks = parseTodoistCsv(EXPORT);
    expect(tasks).toHaveLength(4);
    expect(tasks[0]).toEqual({
      content: "Buy groceries",
      description: null,
      priority: 4,
      date: "2026-06-13",
    });
    expect(tasks[1]).toMatchObject({
      content: "Reply to HOA, politely",
      description: "Keep it short",
      priority: 3,
    });
    expect(tasks[2]).toMatchObject({
      content: 'Quote "everything" carefully',
      priority: 1,
      date: "every day",
    });
  });

  it("rejects files that are not Todoist exports", () => {
    expect(() => parseTodoistCsv("name,email\nGeert,x@y.z")).toThrow(/Todoist/);
  });
});

describe("priorityToFlags", () => {
  it("seeds quadrants from p1-p4 (1 = highest, per Todoist CSV)", () => {
    expect(priorityToFlags(1)).toEqual({ important: true, urgent: true }); // Q1
    expect(priorityToFlags(2)).toEqual({ important: true, urgent: false }); // Q2
    expect(priorityToFlags(3)).toEqual({ important: false, urgent: true }); // Q3
    expect(priorityToFlags(4)).toEqual({ important: false, urgent: false }); // Q4
  });
});

describe("parseTodoistDate", () => {
  it("parses real dates and drops recurring phrases", () => {
    expect(parseTodoistDate("2026-06-13")?.getFullYear()).toBe(2026);
    expect(parseTodoistDate("every day")).toBeNull();
    expect(parseTodoistDate("not a date at all")).toBeNull();
    expect(parseTodoistDate(null)).toBeNull();
  });
});
