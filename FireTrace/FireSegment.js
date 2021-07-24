// Currently only using Unburnable and Burned
export const Unburnable = 0 // May never change
export const Burnable = 1 // May change to Burning or Burned
export const Burning = 2 // May change to Burned
export const Burned = 3 // May never change

/*
- A FireSegment is a horizontal line segment with:
  - a begining and an ending position, and
  - a burning status of either 'Burned' or 'Unburnable'.
*/
export class FireSegment {
  constructor (begins, ends, status) {
    this._begins = begins
    this._ends = ends
    this._status = status
  }

  // Returns the beginning (left) boundary
  begins () { return this._begins }

  // Returns the ending (right) boundary
  ends () { return this._ends }

  isBurnable () { return this._status === Burnable }

  isBurning () { return this._status === Burning }

  isBurned () { return this._status === Burned }

  isUnburnable () { return this._status === Unburnable }

  setBurned () { this._status = Burned }

  // Returns the status
  status () { return this._status }
}
