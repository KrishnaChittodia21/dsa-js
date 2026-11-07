class Solution {
    public int timeRequiredToBuy(int[] tickets, int k) {
        int[] left = tickets.clone();  // do not mutate the input
        ArrayDeque<Integer> q = new ArrayDeque<>();
        for (int i = 0; i < left.length; i++) q.offer(i);
        int time = 0;
        while (true) {
            int i = q.poll();
            left[i]--;
            time++;  // one second per ticket
            if (i == k && left[i] == 0) return time;
            if (left[i] > 0) q.offer(i);  // back of the line
        }
    }
}
