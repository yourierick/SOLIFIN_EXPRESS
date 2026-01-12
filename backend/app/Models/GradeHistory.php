<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradeHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'grade_id',
    ];

    /**
     * Get the user that owns the grade history.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the grade that owns the grade history.
     */
    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class);
    }

    /**
     * Scope a query to only include grade histories within a date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        if ($startDate) {
            $query->whereDate('grade_histories.created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('grade_histories.created_at', '<=', $endDate);
        }
        return $query;
    }

    /**
     * Scope a query to search by user name or account ID.
     */
    public function scopeSearchUser($query, $search)
    {
        if ($search) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('account_id', 'like', "%{$search}%");
            });
        }
        return $query;
    }

    /**
     * Scope a query to filter by grade.
     */
    public function scopeByGrade($query, $gradeId)
    {
        if ($gradeId) {
            $query->where('grade_id', $gradeId);
        }
        return $query;
    }
}
