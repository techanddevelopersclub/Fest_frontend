import { useMemo, useState } from "react";
import { useListPendingParticipantsQuery, useVerifyPendingParticipantMutation, useRejectPendingParticipantMutation } from "../../state/redux/pendingParticipants/pendingParticipantsApi";
import { useListPendingEntryPassesQuery, useRejectPendingEntryPassMutation, useVerifyPendingEntryPassMutation } from "../../state/redux/pendingEntryPass/pendingEntryPassApi";
import { Button } from "../../components/AdminCommons/ui/button";
import Modal from "../../apps/client/components/Modal/Modal";
import { Loader2, ExternalLink } from "lucide-react"; // Assuming you use lucide-react for icons

// A simple spinner component for loading states
const Spinner = () => (
    <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
);

// A component for empty/error states
const EmptyState = ({ message }) => (
    <div className="text-center py-10 px-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500">{message}</p>
    </div>
);

const PaymentVerifications = () => {
    const [activeTab, setActiveTab] = useState("participants"); // 'participants' or 'entryPasses'
    const [modal, setModal] = useState(null); // { id, type, name }
    const [rejectReason, setRejectReason] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetching data using RTK Query hooks
    const { data: participants = [], isLoading: isLoadingParticipants, refetch: refetchParticipants } = useListPendingParticipantsQuery();
    const { data: entryPasses = [], isLoading: isLoadingEntryPasses, refetch: refetchEntryPasses } = useListPendingEntryPassesQuery();

    // Mutations
    const [verifyParticipant] = useVerifyPendingParticipantMutation();
    const [rejectParticipant] = useRejectPendingParticipantMutation();
    const [verifyEntryPass] = useVerifyPendingEntryPassMutation();
    const [rejectEntryPass] = useRejectPendingEntryPassMutation();

    // Memoized filtering for performance
    const filteredData = useMemo(() => {
        const data = activeTab === 'participants' ? participants : entryPasses;
        if (!searchTerm) return data;
        
        return data.filter(item => {
            if (activeTab === 'participants') {
                const teamName = item.teamName?.toLowerCase() || '';
                const leaderName = item.leader?.name?.toLowerCase() || '';
                return teamName.includes(searchTerm.toLowerCase()) || leaderName.includes(searchTerm.toLowerCase());
            } else {
                const userName = item.user?.name?.toLowerCase() || '';
                return userName.includes(searchTerm.toLowerCase());
            }
        });
    }, [searchTerm, participants, entryPasses, activeTab]);
    
    const handleVerify = async (id, type) => {
        setIsSubmitting(true);
        if (type === "participant") {
            await verifyParticipant(id);
            refetchParticipants();
        } else {
            await verifyEntryPass(id);
            refetchEntryPasses();
        }
        setIsSubmitting(false);
    };

    const handleReject = async () => {
        if (!rejectReason.trim() || !modal) return;
        setIsSubmitting(true);

        const { id, type } = modal;
        if (type === "participant") {
            await rejectParticipant({ id, reason: rejectReason });
            refetchParticipants();
        } else {
            await rejectEntryPass({ id, reason: rejectReason });
            refetchEntryPasses();
        }
        
        // Reset and close modal
        setModal(null);
        setRejectReason("");
        setIsSubmitting(false);
    };
    
    const isLoading = isLoadingParticipants || isLoadingEntryPasses;
    const currentData = filteredData;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-sans">
            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-800">Payment Verification</h1>
                    <p className="mt-1 text-sm text-gray-500">Review and approve pending payments for events and entry passes.</p>
                </div>

                {/* Tabs */}
                <div className="px-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            onClick={() => setActiveTab('participants')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'participants' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Participants
                        </button>
                        <button
                            onClick={() => setActiveTab('entryPasses')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'entryPasses' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            Entry Passes
                        </button>
                    </nav>
                </div>
                
                {/* Filters */}
                <div className="p-4 bg-gray-50">
                     <input
                        type="text"
                        placeholder={activeTab === 'participants' ? "Search by team or leader name..." : "Search by user name..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* Content Area */}
                <div className="p-6">
                    {isLoading ? <Spinner /> : (
                        currentData.length === 0 ? <EmptyState message="No pending verifications found." /> : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                                            {activeTab === 'participants' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>}

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proof</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentData.map(item => {
                                            const isParticipant = activeTab === 'participants';
                                            const userName = isParticipant ? item.leader?.name : item.user?.name;
                                            
                                            return (
                                                <tr key={item._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{userName || (isParticipant ? item.leader : item.user)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.event?.name || item.event}</td>
                                                    {isParticipant && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.teamName}</td>}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{isParticipant ? item.event?.registrationFeesInINR : item.event?.entryPassPriceInINR}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <a href={item.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm">
                                                            View <ExternalLink className="ml-1 h-4 w-4" />
                                                        </a>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                        <Button onClick={() => handleVerify(item._id, isParticipant ? 'participant' : 'entryPass')} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">Verify</Button>
                                                        <Button onClick={() => setModal({ id: item._id, type: isParticipant ? 'participant' : 'entryPass', name: userName })} variant="danger" disabled={isSubmitting}>Reject</Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Rejection Modal */}
            {modal && (
                <Modal title={`Reject Payment for ${modal.name || 'User'}`} close={() => setModal(null)}>
                    <div className="space-y-4">
                        <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700">Please provide a reason for rejection:</label>
                        <textarea
                            id="rejectReason"
                            rows={4}
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., Amount incorrect, screenshot unclear..."
                        />
                        <div className="flex justify-end space-x-3 pt-2">
                            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
                            <Button onClick={handleReject} variant="danger" disabled={isSubmitting || !rejectReason.trim()}>
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Submit Rejection"}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default PaymentVerifications;