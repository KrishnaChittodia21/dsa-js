class RecentCounter {
    private final ArrayDeque<Integer> q = new ArrayDeque<>();

    public RecentCounter() {
    }

    public int ping(int t) {
        q.offer(t);
        while (q.peek() < t - 3000) q.poll();  // expired from the front
        return q.size();
    }
}
