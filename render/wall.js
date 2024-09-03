// interface
class Wall {
  render(wallData, updateClipArrayCallback) {
    // implemented by the concrete strategies
    throw new Error("render method must be implemented");
  }

  setDrawWallSegmentFlag(canDraw) {}
}
