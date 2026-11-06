class MyQueue {
    private final Deque<Integer> inbox = new ArrayDeque<>();  // newest on top
    private final Deque<Integer> outbox = new ArrayDeque<>(); // oldest on top

    public MyQueue() {
    }

    public void push(int x) {
        inbox.push(x);
    }

    private void refill() {
        // Only pour when outbox is empty — otherwise FIFO order breaks.
        if (outbox.isEmpty()) {
            while (!inbox.isEmpty()) outbox.push(inbox.pop());
        }
    }

    public int pop() {
        refill();
        return outbox.pop();
    }

    public int peek() {
        refill();
        return outbox.peek();
    }

    public boolean empty() {
        return inbox.isEmpty() && outbox.isEmpty();
    }
}
