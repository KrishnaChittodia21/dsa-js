class MyCalendarThree {
    private final TreeMap<Integer, Integer> delta = new TreeMap<>();   // time -> change in active events, sorted by time

    public MyCalendarThree() {
    }

    public int book(int startTime, int endTime) {
        delta.merge(startTime, 1, (a, b) -> a + b);
        delta.merge(endTime, -1, (a, b) -> a + b);
        int active = 0, best = 0;
        for (int d : delta.values()) {   // sweep left to right
            active += d;
            best = Math.max(best, active);
        }
        return best;
    }
}
