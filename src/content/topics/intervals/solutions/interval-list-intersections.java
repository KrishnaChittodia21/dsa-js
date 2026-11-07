class Solution {
    public int[][] intervalIntersection(int[][] firstList, int[][] secondList) {
        List<int[]> out = new ArrayList<>();
        int i = 0, j = 0;
        while (i < firstList.length && j < secondList.length) {
            int lo = Math.max(firstList[i][0], secondList[j][0]);
            int hi = Math.min(firstList[i][1], secondList[j][1]);
            if (lo <= hi) out.add(new int[]{lo, hi}); // closed: a single point counts
            if (firstList[i][1] < secondList[j][1]) i++; // the earlier-ending interval is done
            else j++;
        }
        return out.toArray(new int[0][]);
    }
}
