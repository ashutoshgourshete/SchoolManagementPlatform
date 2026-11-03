using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Data.Migrations
{
    [Migration("20261103000000_AddStaffHierarchy")]
    public partial class AddStaffHierarchy : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ReportsToStaffId",
                table: "StaffMembers",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StaffMembers_ReportsToStaffId",
                table: "StaffMembers",
                column: "ReportsToStaffId");

            migrationBuilder.AddForeignKey(
                name: "FK_StaffMembers_StaffMembers_ReportsToStaffId",
                table: "StaffMembers",
                column: "ReportsToStaffId",
                principalTable: "StaffMembers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StaffMembers_StaffMembers_ReportsToStaffId",
                table: "StaffMembers");

            migrationBuilder.DropIndex(
                name: "IX_StaffMembers_ReportsToStaffId",
                table: "StaffMembers");

            migrationBuilder.DropColumn(
                name: "ReportsToStaffId",
                table: "StaffMembers");
        }
    }
}
