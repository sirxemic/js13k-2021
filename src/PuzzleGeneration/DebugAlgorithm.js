import { GenerationAlgorithmBase } from './GenerationAlgorithmBase.js'

export class DebugAlgorithm extends GenerationAlgorithmBase {
  constructor () {
    super(7, 7, false)
  }

  generate () {
    const data = JSON.parse("[{\"center\":{\"x\":3.5,\"y\":6},\"spaces\":[{\"x\":3,\"y\":5,\"id\":0},{\"x\":3,\"y\":6,\"id\":0},{\"x\":4,\"y\":5,\"id\":0},{\"x\":2,\"y\":6,\"id\":0}]},{\"center\":{\"x\":5,\"y\":3.5},\"spaces\":[{\"x\":4,\"y\":2,\"id\":1},{\"x\":5,\"y\":2,\"id\":1},{\"x\":4,\"y\":3,\"id\":1},{\"x\":5,\"y\":3,\"id\":1},{\"x\":6,\"y\":2,\"id\":1},{\"x\":3,\"y\":3,\"id\":1},{\"x\":4,\"y\":1,\"id\":1},{\"x\":5,\"y\":4,\"id\":1},{\"x\":4,\"y\":4,\"id\":1},{\"x\":3,\"y\":4,\"id\":1},{\"x\":6,\"y\":3,\"id\":1},{\"x\":5,\"y\":5,\"id\":1},{\"x\":5,\"y\":6,\"id\":1},{\"x\":4,\"y\":0,\"id\":1}]},{\"center\":{\"x\":6,\"y\":1},\"spaces\":[{\"x\":5,\"y\":0,\"id\":2},{\"x\":6,\"y\":0,\"id\":2},{\"x\":5,\"y\":1,\"id\":2},{\"x\":6,\"y\":1,\"id\":2}]},{\"center\":{\"x\":1.5,\"y\":4},\"spaces\":[{\"x\":1,\"y\":3,\"id\":3},{\"x\":1,\"y\":4,\"id\":3},{\"x\":2,\"y\":4,\"id\":3},{\"x\":0,\"y\":3,\"id\":3},{\"x\":1,\"y\":1,\"id\":3},{\"x\":1,\"y\":6,\"id\":3},{\"x\":1,\"y\":2,\"id\":3},{\"x\":1,\"y\":5,\"id\":3},{\"x\":2,\"y\":5,\"id\":3},{\"x\":0,\"y\":2,\"id\":3}]},{\"center\":{\"x\":6.5,\"y\":5.5},\"spaces\":[{\"x\":6,\"y\":5,\"id\":4},{\"x\":6,\"y\":4,\"id\":4},{\"x\":6,\"y\":6,\"id\":4}]},{\"center\":{\"x\":0.5,\"y\":5.5},\"spaces\":[{\"x\":0,\"y\":5,\"id\":5},{\"x\":0,\"y\":6,\"id\":5},{\"x\":0,\"y\":4,\"id\":5}]},{\"center\":{\"x\":1.5,\"y\":0.5},\"spaces\":[{\"x\":1,\"y\":0,\"id\":7},{\"x\":0,\"y\":0,\"id\":7},{\"x\":2,\"y\":0,\"id\":7}]},{\"center\":{\"x\":3,\"y\":2.5},\"spaces\":[{\"x\":2,\"y\":2,\"id\":8},{\"x\":3,\"y\":2,\"id\":8}]},{\"center\":{\"x\":0.5,\"y\":1.5},\"spaces\":[{\"x\":0,\"y\":1,\"id\":9,\"isSingleton\":true}]},{\"center\":{\"x\":3.5,\"y\":0.5},\"spaces\":[{\"x\":3,\"y\":0,\"id\":10,\"isSingleton\":true}]},{\"center\":{\"x\":4.5,\"y\":6.5},\"spaces\":[{\"x\":4,\"y\":6,\"id\":11,\"isSingleton\":true}]},{\"center\":{\"x\":2.5,\"y\":3.5},\"spaces\":[{\"x\":2,\"y\":3,\"id\":13,\"isSingleton\":true}]},{\"center\":{\"x\":3,\"y\":1.5},\"spaces\":[{\"x\":2,\"y\":1,\"id\":12,\"isSingleton\":false},{\"x\":3,\"y\":1,\"id\":6,\"isSingleton\":false}]}]")

    for (const item of data) {
      const galaxy = this.board.addGalaxyAt(item.center)
      galaxy.spaces = new Set(item.spaces.map(space => this.board.getSpaceAt(space)))
    }
  }
}