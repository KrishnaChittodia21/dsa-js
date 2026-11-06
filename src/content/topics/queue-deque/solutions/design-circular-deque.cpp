class MyCircularDeque {
    vector<int> buf;
    int cap;
    int head = 0;
    int count = 0;

public:
    MyCircularDeque(int k) : buf(k), cap(k) {}

    bool insertFront(int value) {
        if (isFull()) return false;
        head = (head - 1 + cap) % cap;  // + cap avoids a negative index
        buf[head] = value;
        count++;
        return true;
    }

    bool insertLast(int value) {
        if (isFull()) return false;
        buf[(head + count) % cap] = value;
        count++;
        return true;
    }

    bool deleteFront() {
        if (isEmpty()) return false;
        head = (head + 1) % cap;
        count--;
        return true;
    }

    bool deleteLast() {
        if (isEmpty()) return false;
        count--;
        return true;
    }

    int getFront() {
        return isEmpty() ? -1 : buf[head];
    }

    int getRear() {
        return isEmpty() ? -1 : buf[(head + count - 1) % cap];
    }

    bool isEmpty() {
        return count == 0;
    }

    bool isFull() {
        return count == cap;
    }
};
