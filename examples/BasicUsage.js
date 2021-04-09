// Import and create a SimpleSurfaceFire instance
import { SimpleSurfaceFire, SimpleSurfaceFireInput } from '../src/index.js'
const surface = new SimpleSurfaceFire()

// Get a copy of the SimpleSurfaceFireInput object and make any desired changes
const input = { ...SimpleSurfaceFireInput } // make a copy of the input object
input.fuel.model = 'gs4' // change the fuel model
input.wind.direction.headingFromUpslope = 90 // change the wind direction

// Submit the input and display the results
const results = surface.run(input)
console.log(results)
