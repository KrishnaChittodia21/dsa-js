class MyCircularQueue {
    private final int[] buf;
    private final int cap;
    private int head = 0;   // index of the front element
    private int count = 0;  // number of stored elements

    public MyCircularQueue(int k) {
        buf = new int[k];
        cap = k;
    }

    public boolean enQueue(int value) {
        if (isFull()) return false;
        buf[(head + count) % cap] = value;  // next free slot
        count++;
        return true;
    }

    public boolean deQueue() {
        if (isEmpty()) return false;
        head = (head + 1) % cap;
        count--;
        return true;
    }

    public int Front() {
        return isEmpty() ? -1 : buf[head];
    }

    public int Rear() {
        return isEmpty() ? -1 : buf[(head + count - 1) % cap];
    }

    public boolean isEmpty() {
        return count == 0;
    }

    public boolean isFull() {
        return count == cap;
    }
}
