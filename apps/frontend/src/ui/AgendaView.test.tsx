import type { AgendaItem } from "@orgdrop/domain";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgendaView } from "./AgendaView";

// Mock Agenda Items
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");
const day = String(today.getDate()).padStart(2, "0");
const todayStr = `${year}-${month}-${day}`;

const mockItems: AgendaItem[] = [
	{
		file: "work.org",
		heading: {
			type: "heading",
			level: 2,
			title: "Task Today",
			todoKeyword: "TODO",
			scheduled: `<${todayStr} Fri>`,
		},
	},
	{
		file: "personal.org",
		heading: {
			type: "heading",
			level: 2,
			title: "Task Future",
			todoKeyword: "TODO",
			scheduled: "<2099-01-01 Fri>",
		},
	},
];

describe("AgendaView", () => {
	it("should render sections correctly", () => {
		render(<AgendaView items={mockItems} onItemClick={() => {}} />);
		screen.debug();

		// Check for Today section header (it includes the date)
		// Use getAllByText because "Today" might appear in header and subsection
		expect(screen.getAllByText(/Today/).length).toBeGreaterThan(0);
		// Check for the task title (might appear in Today and Tasks sections)
		expect(screen.getAllByText("Task Today").length).toBeGreaterThan(0);

		// Check for Tasks section
		expect(screen.getByText("Tasks")).toBeDefined();
		expect(screen.getByText("Task Future")).toBeDefined();
	});

	it("should render NEXT items", () => {
		const nextItems: AgendaItem[] = [
			{
				file: "next.org",
				heading: {
					type: "heading",
					level: 2,
					title: "Next Task",
					todoKeyword: "NEXT",
				},
			},
		];
		render(<AgendaView items={nextItems} onItemClick={() => {}} />);
		// NEXT is in a span, getByText should find it
		expect(screen.getAllByText("NEXT").length).toBeGreaterThan(0);
		expect(screen.getByText("Next Task")).toBeDefined();
	});
});
