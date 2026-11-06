class Solution {
    public int carFleet(int target, int[] position, int[] speed) {
        int n = position.length;
        double[][] cars = new double[n][2];
        for (int i = 0; i < n; i++) {
            cars[i][0] = position[i];
            cars[i][1] = (double) (target - position[i]) / speed[i];
        }
        Arrays.sort(cars, (a, b) -> Double.compare(b[0], a[0])); // closest to the target first

        int fleets = 0;
        double lead = 0;                           // arrival time of the fleet ahead
        for (double[] car : cars) {
            if (car[1] > lead) {                   // arrives strictly later -> new fleet
                fleets++;
                lead = car[1];
            }                                      // else it catches up and merges
        }
        return fleets;
    }
}
