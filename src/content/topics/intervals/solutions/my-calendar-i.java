class MyCalendar {
    private final List<int[]> bookings = new ArrayList<>(); // sorted by start, pairwise disjoint, half-open [s, e)

    public MyCalendar() {
    }

    public boolean book(int start, int end) {
        // lower bound: first booking whose start >= start
        int lo = 0, hi = bookings.size();
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (bookings.get(mid)[0] < start) lo = mid + 1;
            else hi = mid;
        }
        if (lo < bookings.size() && bookings.get(lo)[0] < end) return false; // successor starts too early
        if (lo > 0 && bookings.get(lo - 1)[1] > start) return false;         // predecessor ends too late
        bookings.add(lo, new int[]{start, end});
        return true;
    }
}
