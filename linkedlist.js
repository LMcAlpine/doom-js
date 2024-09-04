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
    this.current = null;
  }

  add(item) {
    this.size++;
    let node = new MyNode(item);
    this.current = node;
    if (this.head === null) {
      this.head = node;
    } else {
      this.head.next = node;
    }
  }
}

const myList = new LinkedList();
myList.add(1);
myList.add(2);
