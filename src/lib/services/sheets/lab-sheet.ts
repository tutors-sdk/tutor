import type { Grid, ICellRendererParams } from "ag-grid-community";
import type { Lo } from "$lib/services/models/lo-types";
import type { UserMetric } from "$lib/services/types/metrics";

interface LabSheetColumn {
  headerName: string;
  field: string;
  width: number;
  suppressSizeToFit: boolean;
  pinned?: "left";
  cellRenderer?: (params: ICellRendererParams) => HTMLSpanElement;
}

export const options = {
  animateRows: true,
  headerHeight: 180,
  defaultColDef: {
    sortable: true,
    resizable: true
  },
  enableRangeSelection: true,
  enableCellChangeFlash: true,
  enableCharts: true,
  getRowId: function (data) {
    return data.github;
  }
};

export class LabSheet {
  title = "";
  subtitle = "";

  columnDefs: LabSheetColumn[] = [
    { headerName: "Name", field: "user", width: 180, suppressSizeToFit: true, pinned: "left" },
    {
      headerName: "Github ID",
      field: "github",
      width: 80,
      suppressSizeToFit: true,
      cellRenderer: this.renderGithub
    },
    { headerName: "Total Minutes", field: "summary", width: 60, suppressSizeToFit: true }
  ];
  sortModel = [{ colId: "summary", sort: "dsc" }];
  rowData = [];

  renderGithub(params: ICellRendererParams<any, any, any>): HTMLSpanElement {
    const nameElement = document.createElement("span");
    if (params.value) {
      const a = document.createElement("a");
      const linkText = document.createTextNode(params.value);
      a.appendChild(linkText);
      a.title = params.value;
      a.href = "http://github.com/" + a.title;
      a.setAttribute("target", "_blank");
      nameElement.appendChild(a);
    }
    return nameElement;
  }

  formatName(userName: string, email: string) {
    let name = userName;
    const fullName = name;
    if (name === email) {
      name = "~~ " + email;
    } else {
      const firstName = fullName.split(" ").slice(0, -1).join(" ");
      const lastName = fullName.split(" ").slice(-1).join(" ");
      name = lastName + ", " + firstName;
    }
    return name;
  }

  creatRow(user: UserMetric) {
    const row = {
      user: user.name, //this.formatName(user.name, user.email),
      summary: 0,
      date: user.last,
      github: user.nickname
    };
    return row;
  }

  render(grid: Grid) {
    if (grid) {
      const api = grid.gridOptions.api;
      api.setColumnDefs(this.columnDefs);
      const sortedRowData = this.rowData.sort((c1, c2) => (c1.summary < c2.summary ? 1 : c1.summary > c2.summary ? -1 : 0));
      api.setRowData(sortedRowData);
    }
  }

  chart(grid: Grid, chartType: string) {
    if (grid) {
      const api = grid.gridOptions.api;
      const columnNames = [];
      this.columnDefs.forEach((columnDef) => {
        if (columnDef.field != "summary") columnNames.push(columnDef.field);
      });
      api.createRangeChart({
        chartType: chartType,
        cellRange: {
          rowStartIndex: 0,
          rowEndIndex: this.rowData.length,
          columns: columnNames
        },
        chartContainer: document.querySelector("#chart")
        //suppressChartRanges: true,
        //unlinkChart: true,
      });
    }
  }

  clear(grid) {
    if (grid) {
      grid.gridOptions.api.setRowData([]);
      this.rowData = [];
      this.columnDefs.length = 4;
    }
  }

  zeroEntries(los: Lo[], row) {
    los.forEach((lab) => {
      row[`${lab.title}`] = 0;
    });
  }

  zeroEntriesComplete(los: Lo[], row) {
    los.forEach((lab) => {
      lab.los.forEach((step) => {
        row[`${lab.title + step.shortTitle}`] = 0;
      });
    });
  }
}
