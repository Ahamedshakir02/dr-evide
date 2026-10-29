import { describe, expect, it } from "vitest";
import { nearKerala, parseCoords } from "../src/components/admin/client";

/**
 * The approve form places the clinic from whatever the reviewer pastes. A
 * wrong pin is a wrong distance on every search, so the parser is pinned to
 * the formats people actually copy.
 */
describe("parseCoords", () => {
  it("reads a copied 'lat, lng' pair", () => {
    expect(parseCoords("10.7812, 76.0123")).toEqual({ lat: 10.7812, lng: 76.0123 });
    expect(parseCoords("  10.7812,76.0123 ")).toEqual({ lat: 10.7812, lng: 76.0123 });
    expect(parseCoords("(10.7812 76.0123)")).toEqual({ lat: 10.7812, lng: 76.0123 });
  });

  it("prefers a place link's own pin over the map centre", () => {
    const url =
      "https://www.google.com/maps/place/Clinic/@10.70,75.90,15z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d10.7812!4d76.0123";
    expect(parseCoords(url)).toEqual({ lat: 10.7812, lng: 76.0123 });
  });

  it("falls back to the map centre, then to query parameters", () => {
    expect(parseCoords("https://www.google.com/maps/@10.78,76.01,17z")).toEqual({ lat: 10.78, lng: 76.01 });
    expect(parseCoords("https://maps.google.com/?q=10.7812,76.0123")).toEqual({ lat: 10.7812, lng: 76.0123 });
    expect(parseCoords("https://www.google.com/maps/search/?api=1&query=10.7812%2C76.0123")).toEqual({
      lat: 10.7812,
      lng: 76.0123,
    });
  });

  it("returns null for links that carry no coordinates, and for nonsense", () => {
    expect(parseCoords("https://maps.app.goo.gl/AbCdEf123")).toBeNull();
    expect(parseCoords("near the bus stand")).toBeNull();
    expect(parseCoords("")).toBeNull();
    expect(parseCoords(null)).toBeNull();
    expect(parseCoords("95.0, 76.0")).toBeNull();
  });

  it("flags a swapped pair as not near Kerala", () => {
    expect(nearKerala({ lat: 10.78, lng: 76.01 })).toBe(true);
    expect(nearKerala({ lat: 76.01, lng: 10.78 })).toBe(false);
  });
});
