class MyCircularDeque {
    private final int[] buf;
    private final int cap;
    private int head = 0;
    private int count = 0;

    public MyCircularDeque(int k) {
        buf = new int[k];
        cap = k;
    }

    public boolean insertFront(int value) {
        if (isFull()) return false;
        head = (head - 1 + cap) % cap;  // + cap avoids a negative index
        buf[head] = value;
        count++;
        return true;
    }

    public boolean insertLast(int value) {
        if (isFull()) return false;
        buf[(head + count) % cap] = value;
        count++;
        return true;
    }

    public boolean deleteFront() {
        if (isEmpty()) return false;
        head = (head + 1) % cap;
        count--;
        return true;
    }

    public boolean deleteLast() {
        if (isEmpty()) return false;
        count--;
        return true;
    }

    public int getFront() {
        return isEmpty() ? -1 : buf[head];
    }

    public int getRear() {
        return isEmpty() ? -1 : buf[(head + count - 1) % cap];
    }

    public boolean isEmpty() {
        return count == 0;
    }

    public boolean isFull() {
        return count == cap;
    }
}
