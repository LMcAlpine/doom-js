class MyNode {
  constructor(item) {
    this.item = item;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.size = 0;
    this.head = null;
  }

  add(item) {
    let node = new MyNode(item);
    this.head = node;
  }
}

const myList = new LinkedList();
myList.add(1);
