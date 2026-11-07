class RangeModule {
    private final List<int[]> iv = new ArrayList<>();   // sorted, disjoint, non-touching [start, end) pairs

    public RangeModule() {
    }

    // first index whose interval satisfies pred (pred must be false...false,true...true)
    private int firstIdx(Predicate<int[]> pred) {
        int lo = 0, hi = iv.size();
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (pred.test(iv.get(mid))) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    public void addRange(int left, int right) {
        int l = left, r = right;
        int i = firstIdx(a -> a[1] >= l);                  // first interval touching/after left
        int j = i;
        while (j < iv.size() && iv.get(j)[0] <= right) {   // overlaps or touches [left, right)
            left = Math.min(left, iv.get(j)[0]);
            right = Math.max(right, iv.get(j)[1]);
            j++;
        }
        iv.subList(i, j).clear();
        iv.add(i, new int[]{left, right});
    }

    public boolean queryRange(int left, int right) {
        int k = firstIdx(a -> a[0] > left) - 1;            // last interval starting at/before left
        return k >= 0 && iv.get(k)[1] >= right;
    }

    public void removeRange(int left, int right) {
        int i = firstIdx(a -> a[1] > left);                // first interval reaching past left
        int j = i;
        List<int[]> pieces = new ArrayList<>();
        while (j < iv.size() && iv.get(j)[0] < right) {
            int start = iv.get(j)[0], end = iv.get(j)[1];
            if (start < left) pieces.add(new int[]{start, left});   // keep the part before the cut
            if (end > right) pieces.add(new int[]{right, end});     // keep the part after the cut
            j++;
        }
        iv.subList(i, j).clear();
        iv.addAll(i, pieces);
    }
}
