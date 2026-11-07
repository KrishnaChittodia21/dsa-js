class Solution {
    public int findMaximizedCapital(int k, int w, int[] profits, int[] capital) {
        int n = profits.length;
        int[][] projects = new int[n][];
        for (int i = 0; i < n; i++) projects[i] = new int[]{capital[i], profits[i]};
        Arrays.sort(projects, (a, b) -> Integer.compare(a[0], b[0]));

        PriorityQueue<Integer> avail = new PriorityQueue<>(Collections.reverseOrder()); // profits we can afford
        int i = 0;
        for (int round = 0; round < k; round++) {
            while (i < n && projects[i][0] <= w) avail.offer(projects[i++][1]); // unlock
            if (avail.isEmpty()) break;      // nothing affordable now or ever
            w += avail.poll();               // choose the most profitable
        }
        return w;
    }
}
