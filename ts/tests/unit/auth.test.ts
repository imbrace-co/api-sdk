import { describe, it, expect } from "vitest"
import { TokenManager } from "../../src/auth/token-manager.js"

describe("TokenManager", () => {
  it("starts with undefined token", () => {
    const tm = new TokenManager()
    expect(tm.getToken()).toBeUndefined()
  })

  it("accepts initial token", () => {
    const tm = new TokenManager("tok_abc")
    expect(tm.getToken()).toBe("tok_abc")
  })

  it("setToken updates value", () => {
    const tm = new TokenManager()
    tm.setToken("tok_xyz")
    expect(tm.getToken()).toBe("tok_xyz")
  })

  it("clear sets token to undefined", () => {
    const tm = new TokenManager("tok_abc")
    tm.clear()
    expect(tm.getToken()).toBeUndefined()
  })
})
