<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OwnerReportsDrilldownTest extends TestCase
{
    private function getOwnerUser(): User
    {
        Role::firstOrCreate(
            ['id' => 'owner'],
            ['display_name' => 'Owner', 'description' => 'Pemilik']
        );

        return User::firstOrCreate(
            ['email' => 'owner@retail.test'],
            [
                'name'     => 'Owner Bara Ritel',
                'password' => bcrypt('password'),
                'role_id'  => 'owner',
                'is_active'=> true,
            ]
        );
    }

    private function getCashierUser(): User
    {
        Role::firstOrCreate(
            ['id' => 'cashier'],
            ['display_name' => 'Kasir', 'description' => 'Kasir Retail']
        );

        return User::firstOrCreate(
            ['email' => 'cashier@retail.test'],
            [
                'name'     => 'Kasir Toko',
                'password' => bcrypt('password'),
                'role_id'  => 'cashier',
                'is_active'=> true,
            ]
        );
    }

    public function test_guest_is_redirected_to_login_when_accessing_reports(): void
    {
        $response = $this->get(route('owner.reports.omset-today'));
        $response->assertRedirect(route('login'));
    }

    public function test_non_owner_is_denied_access_to_owner_reports(): void
    {
        $cashier = $this->getCashierUser();

        $response = $this->actingAs($cashier)->get(route('owner.reports.omset-today'));
        $response->assertStatus(403);
    }

    public function test_owner_can_access_omset_today_report(): void
    {
        $owner = $this->getOwnerUser();

        $response = $this->actingAs($owner)->get(route('owner.reports.omset-today'));
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Owner/Reports/OmsetToday')
            ->has('kpiSummary')
            ->has('report')
            ->has('report.kpis')
            ->has('report.products')
            ->has('report.customers')
            ->has('report.orders')
        );
    }

    public function test_owner_can_access_omset_month_report(): void
    {
        $owner = $this->getOwnerUser();

        $response = $this->actingAs($owner)->get(route('owner.reports.omset-month'));
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Owner/Reports/OmsetMonth')
            ->has('kpiSummary')
            ->has('report')
            ->has('report.kpis')
            ->has('report.monthly_grouping')
            ->has('report.products')
            ->has('report.customers')
            ->has('report.orders')
        );
    }

    public function test_owner_can_access_gross_profit_report(): void
    {
        $owner = $this->getOwnerUser();

        $response = $this->actingAs($owner)->get(route('owner.reports.gross-profit'));
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Owner/Reports/GrossProfit')
            ->has('kpiSummary')
            ->has('report')
            ->has('report.kpis')
            ->has('report.products')
            ->has('report.transactions')
        );
    }

    public function test_owner_can_access_cash_bank_report(): void
    {
        $owner = $this->getOwnerUser();

        $response = $this->actingAs($owner)->get(route('owner.reports.cash-bank'));
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Owner/Reports/CashBank')
            ->has('kpiSummary')
            ->has('report')
            ->has('report.kpis')
            ->has('report.inflows_so')
            ->has('report.inflows_pos')
            ->has('report.outflows_po')
            ->has('report.ledger_lines')
        );
    }

    public function test_owner_can_access_receivables_report(): void
    {
        $owner = $this->getOwnerUser();

        $response = $this->actingAs($owner)->get(route('owner.reports.receivables'));
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Owner/Reports/Receivables')
            ->has('kpiSummary')
            ->has('report')
            ->has('report.kpis')
            ->has('report.customers')
            ->has('report.invoices')
            ->has('report.pos_orders')
        );
    }

    public function test_owner_can_access_payables_report(): void
    {
        $owner = $this->getOwnerUser();

        $response = $this->actingAs($owner)->get(route('owner.reports.payables'));
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Owner/Reports/Payables')
            ->has('kpiSummary')
            ->has('report')
            ->has('report.kpis')
            ->has('report.vendors')
            ->has('report.bills')
        );
    }
}
