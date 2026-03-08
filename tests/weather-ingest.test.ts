import { describe, it, expect } from "vitest";
import { aggregateToMonthly } from "@/lib/ingest/sources/open-meteo";

describe("aggregateToMonthly", () => {
  it("computes correct monthly temperature averages", () => {
    // 3 days in January, 2 days in February
    const daily = {
      time: [
        "2000-01-01",
        "2000-01-15",
        "2000-01-31",
        "2000-02-01",
        "2000-02-15",
      ],
      temperature_2m_mean: [5, 10, 15, 20, 22],
      precipitation_sum: [0, 0, 0, 0, 0],
    };

    const result = aggregateToMonthly(daily);

    expect(result["1"].temp_c).toBe(10); // (5+10+15)/3
    expect(result["2"].temp_c).toBe(21); // (20+22)/2
  });

  it("counts rain days using 1mm WMO threshold", () => {
    const daily = {
      time: ["2000-06-01", "2000-06-02", "2000-06-03", "2000-06-04"],
      temperature_2m_mean: [25, 25, 25, 25],
      precipitation_sum: [0.5, 1.0, 2.5, 0.0],
    };

    const result = aggregateToMonthly(daily);

    // 2 out of 4 days had >= 1mm, divided by 30 years
    expect(result["6"].rain_days).toBeCloseTo(2 / 30, 1);
  });

  it("handles null values gracefully", () => {
    const daily = {
      time: ["2000-03-01", "2000-03-02"],
      temperature_2m_mean: [null, 10],
      precipitation_sum: [null, 5.0],
    };

    const result = aggregateToMonthly(daily);

    expect(result["3"].temp_c).toBe(10);
    expect(result["3"].rain_days).toBeCloseTo(1 / 30, 1);
  });

  it("sets sunshine_hours to null for all months", () => {
    const daily = {
      time: ["2000-01-01"],
      temperature_2m_mean: [10],
      precipitation_sum: [0],
    };

    const result = aggregateToMonthly(daily);

    for (let m = 1; m <= 12; m++) {
      expect(result[String(m)].sunshine_hours).toBeNull();
    }
  });

  it("produces all 12 months even with sparse data", () => {
    const daily = {
      time: ["2000-07-15"],
      temperature_2m_mean: [30],
      precipitation_sum: [0],
    };

    const result = aggregateToMonthly(daily);

    expect(Object.keys(result)).toHaveLength(12);
    expect(result["7"].temp_c).toBe(30);
    // Months with no data should have temp_c = 0
    expect(result["1"].temp_c).toBe(0);
  });
});
