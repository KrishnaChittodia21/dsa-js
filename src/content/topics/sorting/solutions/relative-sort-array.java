class Solution {
    public int[] relativeSortArray(int[] arr1, int[] arr2) {
        int[] count = new int[1001];
        for (int v : arr1) count[v]++;

        int[] out = new int[arr1.length];
        int k = 0;
        for (int v : arr2) {                 // arr2 order first
            while (count[v] > 0) { out[k++] = v; count[v]--; }
        }
        for (int v = 0; v <= 1000; v++) {    // leftovers ascending
            while (count[v] > 0) { out[k++] = v; count[v]--; }
        }
        return out;
    }
}
