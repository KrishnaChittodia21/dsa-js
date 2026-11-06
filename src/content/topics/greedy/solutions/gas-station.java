class Solution {
    public int canCompleteCircuit(int[] gas, int[] cost) {
        int total = 0;   // overall surplus: decides if ANY start works
        int tank = 0;    // surplus since the current candidate start
        int start = 0;
        for (int i = 0; i < gas.length; i++) {
            int diff = gas[i] - cost[i];
            total += diff;
            tank += diff;
            if (tank < 0) {  // every start in [start, i] fails
                start = i + 1;
                tank = 0;
            }
        }
        return total >= 0 ? start : -1;
    }
}
