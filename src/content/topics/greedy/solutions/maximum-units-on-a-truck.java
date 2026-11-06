class Solution {
    public int maximumUnits(int[][] boxTypes, int truckSize) {
        int[][] types = boxTypes.clone();
        Arrays.sort(types, (a, b) -> Integer.compare(b[1], a[1])); // most units per box first
        int units = 0;
        for (int[] t : types) {
            if (truckSize == 0) break;
            int take = Math.min(t[0], truckSize);
            units += take * t[1];
            truckSize -= take;
        }
        return units;
    }
}
