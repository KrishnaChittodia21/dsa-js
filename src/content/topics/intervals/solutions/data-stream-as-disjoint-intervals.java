class SummaryRanges {
    private final List<int[]> list = new ArrayList<>(); // sorted, disjoint, non-adjacent closed intervals

    public SummaryRanges() {
    }

    public void addNum(int value) {
        // upper bound: first interval whose start > value
        int lo = 0, hi = list.size();
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (list.get(mid)[0] <= value) lo = mid + 1;
            else hi = mid;
        }
        int[] left = lo > 0 ? list.get(lo - 1) : null;
        int[] right = lo < list.size() ? list.get(lo) : null;

        if (left != null && left[1] >= value) return;        // already covered
        boolean joinLeft = left != null && left[1] == value - 1;
        boolean joinRight = right != null && right[0] == value + 1;

        if (joinLeft && joinRight) {                          // value glues two intervals
            left[1] = right[1];
            list.remove(lo);
        } else if (joinLeft) {
            left[1] = value;
        } else if (joinRight) {
            right[0] = value;
        } else {
            list.add(lo, new int[]{value, value});
        }
    }

    public int[][] getIntervals() {
        int[][] out = new int[list.size()][];
        for (int i = 0; i < out.length; i++) out[i] = list.get(i).clone(); // copies, so callers can't corrupt our state
        return out;
    }
}
