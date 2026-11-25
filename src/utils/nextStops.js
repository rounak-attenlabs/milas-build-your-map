// Turns her answers into three next stops. Placeholder logic for the greybox.
// Real content comes from Ann per stage (see brief, Part 1 item 2).
export default function nextStops(a = {}) {
	const stops = [];
	if (a.stage === "trying") {
		stops.push("Meet Mila for twenty minutes and talk through what the first weeks look like.");
		stops.push("Read what your policy covers for maternity, before you need it.");
		stops.push("Shortlist a doctor you can reach without a long wait.");
	} else if (a.stage === "baby") {
		stops.push("Book the postnatal visits at weeks one and three if they are not already in the diary.");
		stops.push("Ask about lactation support if feeding is harder than expected.");
		stops.push("Give one practical task to the person travelling with you.");
	} else {
		if (a.hospital === "undecided" || a.hospital === "other") stops.push("Visit J Ward at St. Philomena’s and ask how the estimate changes if things change.");
		else stops.push("Book the J Ward visit and ask what is and isn’t in the ₹1,56,000 delivery package.");
		if (a.insurance === "unsure" || a.insurance === "no") stops.push("Read your policy’s room rent limit before admission, or ask us to read it with you.");
		else stops.push("Check that the room you want sits inside your policy’s room rent limit.");
		if (a.doctor === "no") stops.push("Meet Mila and choose a doctor together before the next scan.");
		else stops.push("Bring your partner or family to the next appointment and the Meet Mila call.");
	}
	return stops.slice(0, 3);
}
