class RangeFreqQuery {
    private final Map<Integer, List<Integer>> positions = new HashMap<>();   // value -> sorted list of indices

    public RangeFreqQuery(int[] arr) {
        for (int i = 0; i < arr.length; i++) {
            positions.computeIfAbsent(arr[i], k -> new ArrayList<>()).add(i);   // scanning left→right keeps it sorted
        }
    }

    // first index in a with a[idx] >= x
    private static int lowerBound(List<Integer> a, int x) {
        int lo = 0, hi = a.size();
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (a.get(mid) < x) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    public int query(int left, int right, int value) {
        List<Integer> list = positions.get(value);
        if (list == null) return 0;
        return lowerBound(list, right + 1) - lowerBound(list, left);
    }
}
