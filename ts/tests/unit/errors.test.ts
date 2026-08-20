import { describe, it, expect } from "vitest"
import { ImbraceError, AuthError, ApiError, NetworkError } from "../../src/errors.js"

describe("error hierarchy", () => {
  it("AuthError is instanceof ImbraceError", () => {
    expect(new AuthError()).toBeInstanceOf(ImbraceError)
  })

  it("ApiError is instanceof ImbraceError", () => {
    expect(new ApiError(404, "Not Found")).toBeInstanceOf(ImbraceError)
  })

  it("NetworkError is instanceof ImbraceError", () => {
    expect(new NetworkError()).toBeInstanceOf(ImbraceError)
  })

  it("ApiError carries statusCode", () => {
    const err = new ApiError(422, "Unprocessable")
    expect(err.statusCode).toBe(422)
    expect(err.message).toContain("[422]")
    expect(err.message).toContain("Unprocessable")
  })

  it("AuthError has correct name", () => {
    expect(new AuthError().name).toBe("AuthError")
  })

  it("NetworkError has correct name", () => {
    expect(new NetworkError().name).toBe("NetworkError")
  })
  
})
