class BSPTraversal {
  constructor(levels) {
    this.things = levels.things;
    console.log(this.things);
    this.player = this.things[0];
    console.log(this.player);

    this.nodes = levels.nodes;
  }

  renderBSPNode(nodeID) {
    // check for is this node a leaf node.
    if (this.isSubsector(nodeID)) {
      // getSubsector gives the number of subsector
      // this ID is passed into the renderSubsector method
      //this.renderSubsector(this.getSubsector(nodeID), ctx);
      //  console.log("subsector found");

      return;
    }

    const bsp = this.nodes[nodeID];

    const isOnLeft = this.isPointOnLeftSide(
      this.player.xPosition,
      this.player.yPosition,
      bsp
    );

    // traversing left
    if (isOnLeft) {
      this.renderBSPNode(bsp.leftChild);
      //  this.renderBSPNode(bsp.rightChild);
    } else {
      // traversing right

      this.renderBSPNode(bsp.rightChild);
      // this.renderBSPNode(bsp.leftChild);
    }
  }

  /**
   * Determines if a given point is on the left side of the splitter line.
   * Uses the cross product to calculate the direction of a vector based on player's position and the splitter line.
   *
   * @param {number} xPosition - The player's X position.
   * @param {number} yPosition - The player's Y position.
   * @param {object} nodeID - The node object containing the splitter line's coordinates and direction.
   * @param {number} nodeID.partitionLineX - The X coordinate of the splitter line.
   * @param {number} nodeID.partitionLineY - The Y coordinate of the splitter line.
   * @param {number} nodeID.changeInY - The distance to move in the Y direction to go to the end of the splitter line.
   * @param {number} nodeID.changeInX - The distance to move in the X direction to go to the end of the splitter line.
   * @returns {boolean} True if the point is on the left side of the splitter line, false otherwise.
   */

  isPointOnLeftSide(xPosition, yPosition, nodeID) {
    const dx = xPosition - nodeID.partitionLineX;

    const dy = yPosition - nodeID.partitionLineY;

    const result = Math.round(dx * nodeID.changeInY - dy * nodeID.changeInX);

    return result <= 0;
  }

  isSubsector(node) {
    return (node & 0xffff8000) != 0;
  }

  getSubsector(node) {
    return node ^ 0xffff8000;
  }
}
