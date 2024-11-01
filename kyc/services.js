const { default: mongoose } = require('mongoose');
const KYCRequest = require('./model');

const createKYCRequest = async (userId, status, assignerId = null, workerId = null) => {
    const kycRequest = new KYCRequest({
        user_id: userId,
        status,
        assigner_id: assignerId,
        worker_id: workerId
    });

    return await kycRequest.save();
};

const updateKYCRequestStatus = async (kycRequestId, newStatus) => {
    const kycRequest = await KYCRequest.findById(kycRequestId);
    
    if (!kycRequest) {
        throw new Error('KYC Request not found');
    }

    kycRequest.status = newStatus;

    if (newStatus === 'Completed') {
        kycRequest.valid_until = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
    }

    return await kycRequest.save();
};

const detailsUserKYCRequestsByStatus = async (userId) => {
    const [counts, allKYCRequests] = await Promise.all([
        KYCRequest.aggregate([
            { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]),
        
        KYCRequest.find({ user_id: new mongoose.Types.ObjectId(userId) }, { created_at: 1, status: 1, expires_at: 1 })
    ]);

    const result = counts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
    }, {});

    const total = Object.values(result).reduce((sum, count) => sum + count, 0);

    const countsByStatus = {
        Pending: result['Pending'] || 0,
        InProgress: result['In Progress'] || 0,
        Completed: result['Completed'] || 0,
        Rejected: result['Rejected'] || 0,
        total
    };

    return {
        countsByStatus,
        allKYCRequests
    };
};

const getAllKYCRequestsForUser = async ({ userId, page = 1, limit = 10, sortBy = 'created_at', order = 'asc' }) => {
    const pageNumber = Math.max(parseInt(page, 10), 1);
    const limitNumber = Math.max(parseInt(limit, 10), 1);
    const sortOrder = order === 'asc' ? 1 : -1;
  
    const kycDetails = await KYCRequest.find({ user_id: userId })
      .sort({ [sortBy]: sortOrder })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);
  
    const totalKYCRequests = await KYCRequest.countDocuments({ user_id: userId });
    const totalPages = Math.ceil(totalKYCRequests / limitNumber);
  
    return {
      kycDetails,
      pagination: {
        total: totalKYCRequests,
        totalPages,
        currentPage: pageNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1
      },
    };
  };
    

module.exports = { createKYCRequest, updateKYCRequestStatus, detailsUserKYCRequestsByStatus, getAllKYCRequestsForUser };