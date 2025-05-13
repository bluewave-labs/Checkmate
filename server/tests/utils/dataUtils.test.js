import { NormalizeData, calculatePercentile } from "../../utils/dataUtils.js";
import sinon from "sinon";

describe("NormalizeData", function () {
	it("should normalize response times when checks length is greater than 1", function () {
		const checks = [
			{ responseTime: 20, _doc: { id: 1 } },
			{ responseTime: 40, _doc: { id: 2 } },
			{ responseTime: 60, _doc: { id: 3 } },
		];
		const rangeMin = 1;
		const rangeMax = 100;

		const result = NormalizeData(checks, rangeMin, rangeMax);

		expect(result).to.be.an("array");
		expect(result).to.have.lengthOf(3);
		result.forEach((check) => {
			expect(check).to.have.property("responseTime").that.is.a("number");
			expect(check).to.have.property("originalResponseTime").that.is.a("number");
		});
	});

	it("should return checks with original response times when checks length is 1", function () {
		const checks = [{ responseTime: 20, _doc: { id: 1 } }];
		const rangeMin = 1;
		const rangeMax = 100;

		const result = NormalizeData(checks, rangeMin, rangeMax);
		expect(result).to.be.an("array");
		expect(result).to.have.lengthOf(1);
		expect(result[0]).to.have.property("originalResponseTime", 20);
	});

	it("should handle edge cases with extreme response times", function () {
		const checks = [
			{ responseTime: 5, _doc: { id: 1 } },
			{ responseTime: 95, _doc: { id: 2 } },
		];
		const rangeMin = 1;
		const rangeMax = 100;

		const result = NormalizeData(checks, rangeMin, rangeMax);

		expect(result).to.be.an("array");
		expect(result).to.have.lengthOf(2);
		expect(result[0]).to.have.property("responseTime").that.is.at.least(rangeMin);
		expect(result[1]).to.have.property("responseTime").that.is.at.most(rangeMax);
	});
});

describe("calculatePercentile", function () {
	it("should return the lower value when upper is greater than or equal to the length of the sorted array", function () {
		const checks = [
			{ responseTime: 10 },
			{ responseTime: 20 },
			{ responseTime: 30 },
			{ responseTime: 40 },
			{ responseTime: 50 },
		];

		const percentile = 100;
		const result = calculatePercentile(checks, percentile);
		const expected = 50;
		expect(result).to.equal(expected);
	});
});
