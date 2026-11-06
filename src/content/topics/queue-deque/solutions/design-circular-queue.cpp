class MyCircularQueue {
    vector<int> buf;
    int cap;
    int head = 0;   // index of the front element
    int count = 0;  // number of stored elements

public:
    MyCircularQueue(int k) : buf(k), cap(k) {}

    bool enQueue(int value) {
        if (isFull()) return false;
        buf[(head + count) % cap] = value;  // next free slot
        count++;
        return true;
    }

    bool deQueue() {
        if (isEmpty()) return false;
        head = (head + 1) % cap;
        count--;
        return true;
    }

    int Front() {
        return isEmpty() ? -1 : buf[head];
    }

    int Rear() {
        return isEmpty() ? -1 : buf[(head + count - 1) % cap];
    }

    bool isEmpty() {
        return count == 0;
    }

    bool isFull() {
        return count == cap;
    }
};
