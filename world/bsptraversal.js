class BSPTraversal {
  constructor(levels, subsector) {
    this.things = levels.things;

    this.nodes = levels.nodes;

    this.subsector = subsector;
  }

  traverseBSP(nodeID) {
    // check for is this node a leaf node.

    if (this.isSubsector(nodeID)) {
      traverseCount++;
      // getSubsector gives the number of subsector
      // this ID is passed into the renderSubsector method
      this.subsector.handleSubsector(this.getSubsector(nodeID));

      return;
    }

    const bsp = this.nodes[nodeID];

    const isOnLeft = this.isPointOnLeftSide(
      gameEngine.player.x,
      gameEngine.player.y,
      bsp
    );

    if (isOnLeft) {
      // Traverse the left child first.
      this.traverseBSP(bsp.leftChild);

      // Check if the right bounding box might be visible.
      if (this.isPotentiallyVisible(bsp.rightBoundingBox)) {
        this.traverseBSP(bsp.rightChild);
      }
    } else {
      // Traverse the right child first.
      this.traverseBSP(bsp.rightChild);

      // Check if the left bounding box might be visible.
      if (this.isPotentiallyVisible(bsp.leftBoundingBox)) {
        this.traverseBSP(bsp.leftChild);
      }
    }
  }

  isPotentiallyVisible(boundingBox) {
    const viewPosToFrustumTangent = [
      [3, 0, 2, 1],
      [3, 0, 2, 0],
      [3, 1, 2, 0],
      [0],
      [2, 0, 2, 1],
      [0, 0, 0, 0],
      [3, 1, 3, 0],
      [0],
      [2, 0, 3, 1],
      [2, 1, 3, 1],
      [2, 1, 3, 0],
    ];

    const PROPERTIES = ["top", "bottom", "left", "right"];

    let bx, by;
    if (gameEngine.player.x <= boundingBox.left) {
      bx = 0;
    } else if (gameEngine.player.x < boundingBox.right) {
      bx = 1;
    } else {
      bx = 2;
    }

    if (gameEngine.player.y >= boundingBox.top) {
      by = 0;
    } else if (gameEngine.player.y > boundingBox.bottom) {
      by = 1;
    } else {
      by = 2;
    }

    let viewPos = (by << 2) + bx;
    if (viewPos === 5) {
      return true;
    }

    // if (viewPos === 0) {
    //   // x1,y1 is top left
    //   let x1 = boundingBox.left;
    //   let y1 = boundingBox.top;
    // }
    let x1 = boundingBox[PROPERTIES[viewPosToFrustumTangent[viewPos][0]]];
    let y1 = boundingBox[PROPERTIES[viewPosToFrustumTangent[viewPos][1]]];
    let x2 = boundingBox[PROPERTIES[viewPosToFrustumTangent[viewPos][2]]];
    let y2 = boundingBox[PROPERTIES[viewPosToFrustumTangent[viewPos][3]]];

    let angle1 = gameEngine.player.angleTowardsVertex({ x: x1, y: y1 });

    let angle2 = gameEngine.player.angleTowardsVertex({ x: x2, y: y2 });
    angle1 = Angle.subtract(angle1.angle, gameEngine.player.direction);
    angle2 = Angle.subtract(angle2.angle, gameEngine.player.direction);

    //return true;

    const span = Angle.subtract(angle1.angle, angle2.angle);

    if (span.angle >= 180) {
      return true;
    }

    // this.realWallAngle1 = Object.assign({}, angleToV1);

    const halfFOV = new Angle(45);
    const v1Moved = angle1.add(halfFOV.angle);
    if (v1Moved.angle > 90) {
      const v1MovedAngle = v1Moved.subtract(90);

      if (v1MovedAngle.angle >= span.angle) {
        return false;
      }
      angle1.angle = halfFOV.angle;
    }

    const v2Moved = Angle.subtract(halfFOV.angle, angle2.angle);

    if (v2Moved.angle > 90) {
      angle2 = halfFOV.negateAngle();
    }

    angle1 = angle1.add(90);
    angle2 = angle2.add(90);

    let sx1 = angleToX(angle1.angle);
    let sx2 = angleToX(angle2.angle);
    if (sx1 === sx2) {
      return false;
    }

    sx2--;
    let start = 0;
    while (gameEngine.levelManager.wallRenderer.solidsegs[start].last < sx2) {
      start++;
    }
    if (
      sx1 >= gameEngine.levelManager.wallRenderer.solidsegs[start].first &&
      sx2 <= gameEngine.levelManager.wallRenderer.solidsegs[start].last
    ) {
      return false;
    }
    return true;
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
