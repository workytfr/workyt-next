import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import authMiddleware from '@/middlewares/authMiddleware';
import mongoose from 'mongoose';
import Reward from '@/models/Reward';
import PointTransaction from '@/models/PointTransaction';
import Revision from '@/models/Revision';

export async function GET(req: NextRequest) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const rewardId = searchParams.get('id');

    if (!rewardId || !mongoose.Types.ObjectId.isValid(rewardId)) {
        return NextResponse.json({ error: 'ID de l’événement invalide' }, { status: 400 });
    }

    const reward = await Reward.findById(rewardId);
    if (!reward) {
        return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
    }

    const { startDate, endDate, method, category } = reward;

    // Déterminer collection et expression de group
    let collection: any;
    let groupExpr: any;
    const matchStage: any = {
        createdAt: { $gte: startDate, $lte: endDate }
    };

    if (method === 'highestPoints') {
        collection = PointTransaction;
        groupExpr = { total: { $sum: '$points' } };
    } else {
        collection = Revision;
        groupExpr = { total: { $sum: 1 } };
        if (method === 'mostRevisionsInCategory') {
            matchStage.subject = category;
        }
    }

    // Calcul du top 10
    const top10 = await collection.aggregate([
        { $match: matchStage },
        { $group: { _id: '$user', ...groupExpr } },
        { $sort: { total: -1 } },
        { $limit: 10 },
        { $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user'
            }},
        { $unwind: '$user' },
        { $project: { _id: 0, userId: '$_id', username: '$user.username', total: 1 } }
    ]);

    // Calcul du rang et score de l'utilisateur connecté
    let me: { total: number; rank: number } | null = null;
    try {
        const user = await authMiddleware(req);
        if (user?._id) {
            // Score perso
            const meAgg = await collection.aggregate([
                { $match: { ...matchStage, user: user._id } },
                { $group: { _id: '$user', ...groupExpr } }
            ]);
            const myScore = meAgg[0]?.total || 0;

            // Nombre de users meilleurs
            const better = await collection.aggregate([
                { $match: matchStage },
                { $group: { _id: '$user', ...groupExpr } },
                { $match: { total: { $gt: myScore } } },
                { $count: 'cnt' }
            ]);
            const myRank = (better[0]?.cnt || 0) + 1;

            me = { total: myScore, rank: myRank };
        }
    } catch {
        me = null;
    }

    return NextResponse.json({ top10, me });
}
