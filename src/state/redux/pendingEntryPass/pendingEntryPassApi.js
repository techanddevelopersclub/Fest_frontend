import api from "../api";

const pendingEntryPassApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createPendingEntryPass: builder.mutation({
      query: (body) => ({
        url: "/pending-entry-passes",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PendingEntryPass"],
    }),
    verifyPendingEntryPass: builder.mutation({
      query: (id) => ({
        url: `/pending-entry-passes/${id}/verify`,
        method: "POST",
      }),
      invalidatesTags: ["PendingEntryPass"],
    }),
    rejectPendingEntryPass: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/pending-entry-passes/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["PendingEntryPass"],
    }),
    listPendingEntryPasses: builder.query({
      query: (params) => ({
        url: "/pending-entry-passes",
        params,
      }),
      providesTags: ["PendingEntryPass"],
    }),
  }),
});

export const {
  useCreatePendingEntryPassMutation,
  useVerifyPendingEntryPassMutation,
  useRejectPendingEntryPassMutation,
  useListPendingEntryPassesQuery,
} = pendingEntryPassApi;

export default pendingEntryPassApi;
