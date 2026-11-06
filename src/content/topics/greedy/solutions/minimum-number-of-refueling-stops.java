class Solution {
    public int minRefuelStops(int target, int startFuel, int[][] stations) {
        // fuel of stations we drove past without stopping
        PriorityQueue<Integer> passed = new PriorityQueue<>(Collections.reverseOrder());
        long fuel = startFuel;  // = farthest position reachable right now; can pass 2^31
        int stops = 0;
        int i = 0;
        while (fuel < target) {
            while (i < stations.length && stations[i][0] <= fuel) {
                passed.add(stations[i][1]);
                i++;
            }
            if (passed.isEmpty()) return -1; // stuck, and no station to regret
            fuel += passed.poll();           // "we stopped at the best one"
            stops++;
        }
        return stops;
    }
}
