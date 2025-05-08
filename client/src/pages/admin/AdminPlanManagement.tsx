import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  getAllPlansThunk,
  approvePlanThunk,
  rejectPlanThunk,
  deletePlanThunk,
} from '../../redux/thunks/adminThunk';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import { SubscriptionPlan } from '../../types/authTypes';
import { toast } from 'react-toastify';

const AdminPlanManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    plans = [],
    loading,
    error,
    totalPages: totalPagesFromState,
  } = useAppSelector((state) => state.admin);
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (user?.role === 'admin') {
      dispatch(
        getAllPlansThunk({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
        })
      );
    }
  }, [dispatch, user?.role, currentPage, searchTerm]);

  useEffect(() => {
    setTotalPages(totalPagesFromState.plans);
  }, [totalPagesFromState.plans]);

  const handleApprovePlan = useCallback(
    async (plan: SubscriptionPlan) => {
      try {
        await dispatch(approvePlanThunk(plan._id)).unwrap();
        toast.success('Plan approved successfully');
      } catch (err) {
        toast.error(`Failed to approve plan: ${err}`);
      }
    },
    [dispatch]
  );

  const handleRejectPlan = useCallback(
    async (plan: SubscriptionPlan) => {
      try {
        await dispatch(rejectPlanThunk(plan._id)).unwrap();
        toast.success('Plan rejected successfully');
      } catch (err) {
        toast.error(`Failed to reject plan: ${err}`);
      }
    },
    [dispatch]
  );

  const handleDeletePlan = useCallback(
    async (plan: SubscriptionPlan) => {
      if (window.confirm('Are you sure you want to delete this plan?')) {
        try {
          await dispatch(deletePlanThunk(plan._id)).unwrap();
          toast.success('Plan deleted successfully');
        } catch (err) {
          toast.error(`Failed to delete plan: ${err}`);
        }
      }
    },
    [dispatch]
  );

  const columns = useMemo(
    () => [
      {
        header: 'Name',
        accessor: (plan: SubscriptionPlan): React.ReactNode =>
          plan.name || 'N/A',
      },
      {
        header: 'Doctor',
        accessor: (plan: SubscriptionPlan): React.ReactNode =>
          plan.doctorName || plan.doctorId || 'N/A',
      },
      {
        header: 'Price',
        accessor: (plan: SubscriptionPlan): React.ReactNode =>
          `₹${(plan.price).toFixed(2)}`,
      },
      {
        header: 'Validity',
        accessor: (plan: SubscriptionPlan): React.ReactNode =>
          `${plan.validityDays} days`,
      },
      {
        header: 'Appointments',
        accessor: (plan: SubscriptionPlan): React.ReactNode =>
          plan.appointmentCount,
      },
      {
        header: 'Status',
        accessor: (plan: SubscriptionPlan): React.ReactNode => (
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              plan.status === 'pending'
                ? 'bg-yellow-500/20 text-yellow-300'
                : plan.status === 'approved'
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-red-500/20 text-red-300'
            }`}
          >
            {plan.status}
          </span>
        ),
      },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        label: 'Approve',
        onClick: handleApprovePlan,
        className: 'bg-green-600 hover:bg-green-700',
        condition: (plan: SubscriptionPlan) => plan.status === 'pending',
      },
      {
        label: 'Reject',
        onClick: handleRejectPlan,
        className: 'bg-red-600 hover:bg-red-700',
        condition: (plan: SubscriptionPlan) => plan.status === 'pending',
      },
      {
        label: 'Delete',
        onClick: handleDeletePlan,
        className: 'bg-gray-600 hover:bg-gray-700',
      },
    ],
    [handleApprovePlan, handleRejectPlan, handleDeletePlan]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-lg p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl">
      <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
        Plan Management
      </h2>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <SearchBar
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search by plan name or doctor..."
        />
      </div>
      <DataTable
        data={plans}
        columns={columns}
        actions={actions}
        isLoading={loading}
        error={error}
        onRetry={() =>
          dispatch(
            getAllPlansThunk({
              page: currentPage,
              limit: itemsPerPage,
              search: searchTerm,
            })
          )
        }
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default AdminPlanManagement;
