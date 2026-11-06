class MyStack {
    private final ArrayDeque<Integer> q = new ArrayDeque<>();

    public MyStack() {
    }

    public void push(int x) {
        q.offer(x);
        // Rotate every older element behind x so x sits at the front.
        for (int i = 1; i < q.size(); i++) q.offer(q.poll());
    }

    public int pop() {
        return q.poll();
    }

    public int top() {
        return q.peek();
    }

    public boolean empty() {
        return q.isEmpty();
    }
}
