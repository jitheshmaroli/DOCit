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
          search: searchTerm || undefined,
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
        accessor: (plan: SubscriptionPlan): React.ReactNode => {
          const maxLength = 20; // Maximum length for the plan name
          const displayName =
            plan.name && plan.name.length > maxLength
              ? `${plan.name.substring(0, maxLength)}...`
              : plan.name || 'N/A';
          return (
            <span
              className="text-sm text-white truncate max-w-[150px]"
              title={plan.name || 'N/A'}
            >
              {displayName}
            </span>
          );
        },
        className: 'align-middle',
      },
      {
        header: 'Doctor',
        accessor: (plan: SubscriptionPlan): React.ReactNode => {
          const doctorName = plan.doctorName || plan.doctorId || 'N/A';
          const maxLength = 20; // Maximum length for the doctor name
          const displayName =
            doctorName.length > maxLength
              ? `${doctorName.substring(0, maxLength)}...`
              : doctorName;
          return (
            <span
              className="text-sm text-white truncate max-w-[150px]"
              title={doctorName}
            >
              {displayName}
            </span>
          );
        },
        className: 'align-middle',
      },
      {
        header: 'Price',
        accessor: (plan: SubscriptionPlan): React.ReactNode =>
          `₹${plan.price.toFixed(2)}`,
      },
      {
        header: 'Validity',
        accessor: (plan: SubscriptionPlan): React.ReactNode =>
          `${plan.validityDays} days`,
      },
      {
        header: 'Status',
        accessor: (plan: SubscriptionPlan): React.ReactNode => (
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              plan.status === 'approved'
                ? 'bg-green-500/20 text-green-300'
                : plan.status === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : 'bg-red-500/20 text-red-300'
            }`}
          >
            {plan.status || 'Pending'}
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
        className:
          'bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg text-sm',
        condition: (plan: SubscriptionPlan) => plan.status === 'pending',
      },
      {
        label: 'Reject',
        onClick: handleRejectPlan,
        className: 'bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-sm',
        condition: (plan: SubscriptionPlan) => plan.status === 'pending',
      },
      {
        label: 'Delete',
        onClick: handleDeletePlan,
        className: 'bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-sm',
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
    <div className="bg-white/10 backdrop-blur-lg p-4 sm:p-6 lg:p-8 rounded-2xl border border-white/20 shadow-xl">
      <h2 className="text-xl font-semibold text-white bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent mb-6">
        Plan Management
      </h2>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <SearchBar
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search plans..."
        />
      </div>
      <DataTable
        data={plans}
        columns={columns}
        actions={actions}
        isLoading={loading}
        error={error}
        onRetry={() => {
          dispatch(
            getAllPlansThunk({
              page: currentPage,
              limit: itemsPerPage,
              search: searchTerm || undefined,
            })
          );
        }}
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
